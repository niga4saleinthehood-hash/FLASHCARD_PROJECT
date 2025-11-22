import io
from fastapi import UploadFile
from pypdf import PdfReader
from docx import Document

async def extract_text_from_file(file: UploadFile) -> str:
    """
    Hàm đa năng: Nhận file Upload -> Trả về toàn bộ text bên trong
    Hỗ trợ: .txt, .pdf, .docx
    """
    filename = file.filename.lower()
    content = await file.read() # Đọc file dưới dạng bytes
    text = ""

    try:
        # 1. Xử lý file PDF
        if filename.endswith(".pdf"):
            # Dùng io.BytesIO để giả lập file từ dữ liệu bytes
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)
            # Đọc từng trang và ghép lại
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
        # 2. Xử lý file Word (.docx)
        elif filename.endswith(".docx"):
            docx_file = io.BytesIO(content)
            doc = Document(docx_file)
            # Đọc từng đoạn văn (paragraph)
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        
        # 3. Xử lý file Text (.txt)
        else:
            # Mặc định coi là text, giải mã utf-8
            text = content.decode("utf-8")

    except Exception as e:
        print(f"❌ Lỗi đọc file {filename}: {e}")
        return "" # Trả về rỗng nếu lỗi

    return text