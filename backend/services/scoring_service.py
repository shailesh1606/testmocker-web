import math
from fractions import Fraction

def _normalize_answer_item(item):
    if item is None:
        return None
    
    a_type = item.get("type")
    a_value = item.get("value")
    
    if a_value is None or str(a_value).strip() == "":
        return None
        
    return {"type": a_type, "value": a_value}

def _compare_answers(user_item, correct_item):
    if not user_item or not user_item.get("value"):
        return False, False, correct_item is not None
        
    if not correct_item or not correct_item.get("value"):
        return True, False, False

    u_val = str(user_item["value"]).strip().lower()
    c_val = str(correct_item["value"]).strip().lower()
    a_type = correct_item["type"]

    is_correct = False
    
    if a_type in ["mcq", "text"]:
        is_correct = (u_val == c_val)
    elif a_type == "numeric":
        try:
            # handle fractions "1/3"
            u_num = float(Fraction(u_val))
            c_num = float(Fraction(c_val))
            is_correct = math.isclose(u_num, c_num, rel_tol=1e-6, abs_tol=1e-3)
        except:
            is_correct = False

    return True, is_correct, True

def calculate_score(user_answers, correct_answers, mpc, nmpw):
    score = 0.0
    correct_count = 0
    wrong_count = 0
    not_attempted_count = 0
    
    results = []

    for i in range(len(correct_answers)):
        u_ans = _normalize_answer_item(user_answers[i] if i < len(user_answers) else None)
        c_ans = _normalize_answer_item(correct_answers[i] if i < len(correct_answers) else None)
        
        is_attempted, is_correct, has_key = _compare_answers(u_ans, c_ans)
        
        if not is_attempted:
            not_attempted_count += 1
            status = "—"
            marks = 0
        elif is_correct:
            correct_count += 1
            score += mpc
            status = "✓"
            marks = mpc
        else:
            wrong_count += 1
            score += nmpw
            status = "✗"
            marks = nmpw
            
        results.append({
            "q_no": i + 1,
            "user_answer": u_ans["value"] if u_ans else None,
            "correct_answer": c_ans["value"] if c_ans else None,
            "type": c_ans["type"] if c_ans else (u_ans["type"] if u_ans else "mcq"),
            "status": status,
            "marks": marks
        })

    return {
        "score": score,
        "correct": correct_count,
        "wrong": wrong_count,
        "not_attempted": not_attempted_count,
        "negative_marks_total": wrong_count * abs(nmpw),
        "details": results
    }
