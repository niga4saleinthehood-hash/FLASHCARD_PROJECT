import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from google.generativeai.types import GenerationConfig

from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from google.api_core import exceptions as google_exceptions


load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("Lỗi: Không tìm thấy API Key trong file .env")

genai.configure(api_key=api_key)

# Sử dụng Model 1.5 Flash (Nhanh & Ổn định)
model = genai.GenerativeModel('gemini-2.5-flash')

# Cấu hình JSON Mode
json_config = GenerationConfig(
    response_mime_type="application/json"
)

# Nếu gặp lỗi server hoặc quá tải, code sẽ:
# - Thử lại tối đa 3 lần
# - Mỗi lần chờ 2 giây
retry_strategy = retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type((
        google_exceptions.ResourceExhausted, # Lỗi 429 (Quá nhanh)
        google_exceptions.ServiceUnavailable, # Lỗi 503 (Server bận)
        google_exceptions.DeadlineExceeded,   # Lỗi Timeout
    ))
)


# LÕI AI SỐ 1: CHUẨN HÓA & SỬA LỖI CHÍNH TẢ 
@retry_strategy
def clean_and_correct_list(raw_input_string: str) -> list[str]:
    """
    Lõi 1: Nhận danh sách thô -> Trả về danh sách sạch.
    """
    
    # Prompt chuẩn từ User
    prompt = f"""
    ROLE: You are a strict English Spell Checker and Formatter.
    
    INPUT: A raw list of English vocabulary words or phrasal verb (separated by newlines or commas), possibly containing typos.
    
    TASK:
    1. Read each line/item.
    2. **Spell Check**: Correct any spelling mistakes (e.g., "integrat" -> "integrate").
    3. **Preserve Form**: Keep the word form exactly as intended (e.g., if input is "utilization", keep "utilization", DO NOT change to "utilize").
    4. **Ignore**: Remove empty lines or non-word characters.
    
    OUTPUT FORMAT: Return strictly a JSON Array of strings.
    
    FEW-SHOT EXAMPLES:
    - Input: 
      native to 
      utilization
      diverse
    - Output: ["native to", "utilization", "diverse"]
    
    - Input: stay clear of, anaylsis
    - Output: ["stay clear of", "analysis"]

    ACTUAL INPUT TO PROCESS:
    ---
    {raw_input_string}
    ---
    """
    
    print("--- 🧹 [Lõi 1] Đang xử lý (Có Retry)... ---")
    try:
        response = model.generate_content(prompt, generation_config=json_config)
        return json.loads(response.text)
    except Exception as e:
        print(f"Lỗi Lõi 1 (Đã hết lượt thử): {e}")
        return []

# LÕI AI SỐ 2: LÀM GIÀU DỮ LIỆU
@retry_strategy
def enrich_word_batch(word_list: list[str]) -> list[dict]:
    """
    Lõi 2: Nhận list từ sạch -> Trả về thông tin chi tiết Flashcard.
    """
    
    input_data = json.dumps(word_list)
    
    # Prompt chuẩn từ User
    prompt = f"""
    ROLE: You are an expert Dictionary Generator.
    TASK: Generate detailed flashcard data for this list of words: {input_data}
    
    OUTPUT REQUIREMENTS:
    Return a JSON Array where each object follows this EXACT schema:
    {{
      "word": "The original word",
      "ipa": "IPA transcription (e.g., /həˈləʊ/)",
      "type": "Part of speech (n, v, adj...)",
      "vietnamese": "Meaning in Vietnamese (short & accurate)",
      "word_family": {{
          "noun": "Noun form (or null if none)",
          "verb": "Verb form (or null if none)",
          "adjective": "Adjective form (or null if none)",
          "adverb": "Adverb form (or null if none)"
      }},
      "synonyms": ["synonym 1", "synonym 2"],
      "collocations": ["collocation 1", "collocation 2 (2-3 items)"],
      "example_sentence": "A natural example sentence."
    }}
    """
    
    print(f"[Lõi 2] Đang gọi AI cho {len(word_list)} từ (Có Retry)...")
    try:
        response = model.generate_content(prompt, generation_config=json_config)
        return json.loads(response.text)
    except Exception as e:
        print(f"Lỗi Lõi 2 (Đã hết lượt thử): {e}")
        return []

#LÕI AI SỐ 3: PHẢN HỒI & CHẤM ĐIỂM
@retry_strategy
def check_user_sentence_stream(word: str, sentence: str):
    """
    Phiên bản Nhận xét (Không chấm điểm):
    Trả về: JSON (Đúng/Sai + Câu sửa) + '|||' + Lời nhận xét chi tiết
    """
    prompt = f"""
    ROLE: You are a helpful and knowledgeable English Language Assistant for Vietnamese learners.
    
    TASK: Analyze the student's sentence regarding the usage of the word "{word}".
    
    GUIDELINES:
    1. **Be Constructive**: Focus on explaining grammar, vocabulary choice, or naturalness.
    2. **No Grading**: Do NOT provide a rating like "Good", "Bad", or "Excellent". Just feedback.
    3. **Correction**: If the sentence is unnatural or wrong, provide a better version.
    
    INPUT:
    - Word: "{word}"
    - User's Sentence: "{sentence}"
    
    OUTPUT FORMAT INSTRUCTIONS:
    1. First, output a VALID JSON object (no markdown) for technical assessment:
       {{"is_correct": boolean, "corrected_sentence": "..."}}
    2. Immediately follow with this exact separator: |||
    3. Finally, write the feedback/explanation in Vietnamese (Stream this part).

    EXAMPLE OUTPUT:
    {{ "is_correct": false, "corrected_sentence": "I go to school." }}|||Câu này của bạn thiếu giới từ 'to'. Động từ 'go' khi chỉ hướng đi cần đi kèm với 'to'...
    """
    
    print(f"----[Lõi 3] Đang Streaming (Chế độ Nhận xét)... ---")
    try:
        # Không dùng json_config để cho phép trả về hỗn hợp
        response = model.generate_content(prompt, stream=True)
        
        for chunk in response:
            if chunk.text:
                yield chunk.text
            
    except Exception as e:
        print(f"Lỗi Stream: {e}")
        yield json.dumps({"error": "Lỗi hệ thống AI"})