import json
import fitz
import openai
from config import settings
from typing import Optional, List, Tuple

def extract_text_from_pdf(pdf_path: str, max_chars: int = 50000) -> str:
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
            if len(text) > max_chars:
                text = text[:max_chars] + "... [truncated]"
                break
        return text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return ""

def is_meaningful_text(text: Optional[str]) -> bool:
    if not text:
        return False
    cleaned = text.strip()
    if len(cleaned) < 40:
        return False
    alnum_count = sum(1 for c in cleaned if c.isalnum())
    if alnum_count < 20:
        return False
    return True

def render_pdf_to_images(pdf_path: str, max_pages: int = 8) -> List[str]:
    import base64
    try:
        doc = fitz.open(pdf_path)
        base64_images = []
        for i in range(min(len(doc), max_pages)):
            page = doc.load_page(i)
            # Use 1.5x resolution scaling for high readability
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            png_bytes = pix.tobytes("png")
            base64_img = base64.b64encode(png_bytes).decode("utf-8")
            base64_images.append(base64_img)
        return base64_images
    except Exception as e:
        print(f"Error rendering PDF to images: {e}")
        return []

async def run_openai_extraction(
    qp_text: Optional[str],
    ak_text: Optional[str],
    num_questions: int,
    qp_images: Optional[List[str]] = None,
    ak_images: Optional[List[str]] = None
) -> dict:
    if not settings.openai_api_key or settings.openai_api_key == "dummy_key":
        raise Exception("OpenAI API key is not configured")

    openai.api_key = settings.openai_api_key
    
    is_vision_mode = bool(qp_images or ak_images)
    
    if ak_text or ak_images:
        doc_type_desc = "scanned/handwritten images of the ANSWER KEY" if ak_images else "extracted text of the ANSWER KEY"
        system_prompt = (
            "You are an expert exam evaluation assistant. Your task is to extract the correct answers for each question from the provided ANSWER KEY.\n"
            f"You will receive {doc_type_desc}. "
            "First, analyze the document and determine the option format used for Multiple Choice Questions (MCQs):\n"
            "- If MCQs use upper-case letters (A, B, C, D), set 'option_format' to 'ABCD'.\n"
            "- If MCQs use numbers (1, 2, 3, 4), set 'option_format' to '1234'.\n"
            "- If MCQs use lower-case letters (a, b, c, d), set 'option_format' to 'abcd'.\n"
            "- If no MCQs are present, set 'option_format' to 'none'.\n"
            "- Otherwise, specify the consistent format used.\n\n"
            "Then, extract the correct answers mapping to this format. Use the Answer Key to map question numbers to their correct answers. "
            "If the Question Paper text/images are also provided, use it only to verify the number of questions, question types, or resolve formatting/mapping issues. "
            "Do not independently solve the questions unless the answer key is ambiguous or missing a specific question.\n\n"
            "You must return a strict JSON response containing:\n"
            "- 'option_format': (string)\n"
            "- 'questions': array of items. Each item must contain:\n"
            "  - 'question_number' (integer)\n"
            "  - 'question_type' (string, either 'mcq', 'numeric', or 'text')\n"
            "  - 'correct_answer' (string or null). If MCQ, correct_answer must strictly use the option characters matching the detected 'option_format' (e.g., if option_format is '1234', correct_answer must be '1', '2', '3', or '4'). For numeric, return the numeric answer (e.g. '10.5'). For text, return a short phrase.\n"
            "  - 'confidence' (string, either 'high', 'medium', or 'low')\n\n"
            "Respond ONLY with valid JSON. Do not include markdown formatting like ```json or trailing explanations."
        )
    else:
        doc_type_desc = "scanned/handwritten images of the QUESTION PAPER" if qp_images else "extracted text of the QUESTION PAPER"
        system_prompt = (
            "You are an expert exam solver and evaluator. Your task is to process the provided QUESTION PAPER and extract the correct answers.\n"
            f"You will receive {doc_type_desc}. "
            "First, analyze the document and determine the option format used for Multiple Choice Questions (MCQs):\n"
            "- If MCQs use upper-case letters (A, B, C, D), set 'option_format' to 'ABCD'.\n"
            "- If MCQs use numbers (1, 2, 3, 4), set 'option_format' to '1234'.\n"
            "- If MCQs use lower-case letters (a, b, c, d), set 'option_format' to 'abcd'.\n"
            "- If no MCQs are present, set 'option_format' to 'none'.\n"
            "- Otherwise, specify the consistent format used.\n\n"
            "First inspect the document to determine whether an answer key, solutions, or a correct answers list is included at the end or start. If one exists, extract the answers from it. "
            "Only if no answer key is available should you independently solve the questions.\n\n"
            "You must return a strict JSON response containing:\n"
            "- 'option_format': (string)\n"
            "- 'questions': array of items. Each item must contain:\n"
            "  - 'question_number' (integer)\n"
            "  - 'question_type' (string, either 'mcq', 'numeric', or 'text')\n"
            "  - 'correct_answer' (string or null). If MCQ, correct_answer must strictly use the option characters matching the detected 'option_format' (e.g., if option_format is '1234', correct_answer must be '1', '2', '3', or '4'). For numeric, return the numeric answer (e.g. '10.5'). For text, return a short phrase.\n"
            "  - 'confidence' (string, either 'high', 'medium', or 'low')\n\n"
            "Respond ONLY with valid JSON. Do not include markdown formatting like ```json or trailing explanations."
        )

    if is_vision_mode:
        user_content = []
        if ak_images:
            user_content.append({
                "type": "text",
                "text": (
                    f"Here are the rendered page images of the scanned/handwritten ANSWER KEY. "
                    f"Please extract exactly {num_questions} questions from these images."
                )
            })
            for img in ak_images:
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{img}"
                    }
                })
            if qp_text:
                user_content.append({
                    "type": "text",
                    "text": f"Here is the text extracted from the Question Paper for reference:\n{qp_text[:15000]}"
                })
            elif qp_images:
                user_content.append({
                    "type": "text",
                    "text": "Here are the rendered page images of the Question Paper for reference:"
                })
                for img in qp_images[:4]:
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{img}"
                        }
                    })
        else:
            user_content.append({
                "type": "text",
                "text": (
                    f"Here are the rendered page images of the scanned QUESTION PAPER. "
                    f"Analyze them and extract/solve exactly {num_questions} questions from these images."
                )
            })
            for img in qp_images:
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{img}"
                    }
                })
    else:
        if ak_text:
            user_content = (
                f"ANSWER KEY TEXT:\n{ak_text}\n\n"
                f"QUESTION PAPER TEXT (Optional reference):\n{qp_text[:20000]}\n\n"
                f"Please extract exactly {num_questions} questions."
            )
        else:
            user_content = (
                f"QUESTION PAPER TEXT:\n{qp_text}\n\n"
                f"Please solve or extract exactly {num_questions} questions."
            )

    response = openai.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.0
    )
    
    return json.loads(response.choices[0].message.content.strip())

async def extract_answers_from_pdf(qp_path: str, ak_path: Optional[str], num_questions: int) -> Tuple[List[dict], str]:
    qp_text = extract_text_from_pdf(qp_path)
    ak_text = extract_text_from_pdf(ak_path) if ak_path else None
    
    qp_is_meaningful = is_meaningful_text(qp_text)
    ak_is_meaningful = is_meaningful_text(ak_text) if ak_path else True
    
    qp_images = None
    ak_images = None
    
    if not qp_is_meaningful:
        print("Question Paper PDF text was insufficient. Rendering PDF to images for vision extraction...")
        qp_images = render_pdf_to_images(qp_path)
        
    if ak_path and not ak_is_meaningful:
        print("Answer Key PDF text was insufficient. Rendering PDF to images for vision extraction...")
        ak_images = render_pdf_to_images(ak_path)
        
    option_format = "ABCD"
    try:
        result_json = await run_openai_extraction(
            qp_text if qp_is_meaningful else None,
            ak_text if ak_is_meaningful else None,
            num_questions,
            qp_images,
            ak_images
        )
        questions = result_json.get("questions", [])
        option_format = result_json.get("option_format", "ABCD")
    except Exception as e:
        print(f"Error during OpenAI answer key extraction: {e}")
        questions = []
        
    answers = []
    q_map = {}
    for q in questions:
        q_num = q.get("question_number")
        if q_num is not None:
            q_map[int(q_num)] = {
                "type": q.get("question_type", "mcq") if q.get("question_type") in ["mcq", "numeric", "text"] else "mcq",
                "value": str(q.get("correct_answer")) if q.get("correct_answer") is not None else ""
            }
            
    for i in range(1, num_questions + 1):
        if i in q_map:
            answers.append(q_map[i])
        else:
            answers.append({"type": "mcq", "value": ""})
            
    return answers, option_format
