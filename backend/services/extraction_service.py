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

async def run_openai_extraction(qp_text: str, ak_text: Optional[str], num_questions: int) -> dict:
    if not settings.openai_api_key or settings.openai_api_key == "dummy_key":
        raise Exception("OpenAI API key is not configured")

    openai.api_key = settings.openai_api_key
    
    if ak_text:
        system_prompt = (
            "You are an expert exam evaluation assistant. Your task is to extract the correct answers for each question from the provided ANSWER KEY text.\n"
            "First, analyze the document and determine the option format used for Multiple Choice Questions (MCQs):\n"
            "- If MCQs use upper-case letters (A, B, C, D), set 'option_format' to 'ABCD'.\n"
            "- If MCQs use numbers (1, 2, 3, 4), set 'option_format' to '1234'.\n"
            "- If MCQs use lower-case letters (a, b, c, d), set 'option_format' to 'abcd'.\n"
            "- If no MCQs are present, set 'option_format' to 'none'.\n"
            "- Otherwise, specify the consistent format used.\n\n"
            "Then, extract the correct answers mapping to this format. Use the Answer Key text to map question numbers to their correct answers. "
            "If the Question Paper text is also provided, use it only to verify the number of questions, question types, or resolve formatting/mapping issues. "
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
        user_content = (
            f"ANSWER KEY TEXT:\n{ak_text}\n\n"
            f"QUESTION PAPER TEXT (Optional reference):\n{qp_text[:20000]}\n\n"
            f"Please extract exactly {num_questions} questions."
        )
    else:
        system_prompt = (
            "You are an expert exam solver and evaluator. Your task is to process the provided QUESTION PAPER text and extract the correct answers.\n"
            "First, analyze the document and determine the option format used for Multiple Choice Questions (MCQs):\n"
            "- If MCQs use upper-case letters (A, B, C, D), set 'option_format' to 'ABCD'.\n"
            "- If MCQs use numbers (1, 2, 3, 4), set 'option_format' to '1234'.\n"
            "- If MCQs use lower-case letters (a, b, c, d), set 'option_format' to 'abcd'.\n"
            "- If no MCQs are present, set 'option_format' to 'none'.\n"
            "- Otherwise, specify the consistent format used.\n\n"
            "First inspect the document to determine whether an answer key, solutions, or a correct answers list is included. If one exists, extract the answers from it. "
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
    
    option_format = "ABCD"
    try:
        result_json = await run_openai_extraction(qp_text, ak_text, num_questions)
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
