import asyncio
import os
import fitz
from services.extraction_service import is_meaningful_text, render_pdf_to_images, extract_text_from_pdf

def test_text_adequacy():
    print("Running text adequacy checks...")
    
    # 1. Scanned/Empty text simulation
    scanned_text_1 = "   "
    scanned_text_2 = "Page 1\n[Image]\n\n"
    scanned_text_3 = "\n\r\t.,-;_!?   " * 15  # long but not alphanumeric enough
    
    # 2. Digital text simulation
    digital_text = (
        "Question 1: What is the capital of France?\n"
        "A) London\nB) Paris\nC) Berlin\nD) Rome\n\n"
        "Question 2: Solve 2 + 2.\n"
        "Options: 1) 2, 2) 3, 3) 4, 4) 5"
    )
    
    assert not is_meaningful_text(scanned_text_1), "Failed scanned_text_1"
    assert not is_meaningful_text(scanned_text_2), "Failed scanned_text_2"
    assert not is_meaningful_text(scanned_text_3), "Failed scanned_text_3"
    assert is_meaningful_text(digital_text), "Failed digital_text"
    
    print("✓ Text adequacy checks passed!")

def test_page_rendering():
    print("Running PDF page rendering checks...")
    # Find any pdf file in the storage directory to test rendering
    storage_dir = "/app/storage"
    if not os.path.exists(storage_dir):
        storage_dir = "../storage"
        
    pdf_files = [f for f in os.listdir(storage_dir) if f.endswith(".pdf")] if os.path.exists(storage_dir) else []
    
    if not pdf_files:
        print("No PDF files available in storage for page rendering test.")
        return
        
    pdf_path = os.path.join(storage_dir, pdf_files[0])
    print(f"Testing rendering on PDF file: {pdf_path}")
    
    images = render_pdf_to_images(pdf_path, max_pages=2)
    assert isinstance(images, list), "render_pdf_to_images should return a list"
    print(f"Generated {len(images)} base64 images from PDF.")
    if images:
        assert len(images[0]) > 100, "Base64 image string is too short"
        print("✓ Page rendering test passed!")

if __name__ == "__main__":
    test_text_adequacy()
    test_page_rendering()
