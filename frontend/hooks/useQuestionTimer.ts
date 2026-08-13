import { useRef, useCallback } from "react";

/**
 * Tracks time spent per question.
 * Call `onQuestionChange(newIndex)` whenever the user navigates to a new
 * question. Call `getTimePerQuestion()` to get the final array before submit.
 */
export function useQuestionTimer(numQuestions: number) {
  // Stores accumulated seconds for each question index
  const accumulated = useRef<number[]>([]);
  // Timestamp (ms) when the current question was last focused
  const startRef = useRef<number>(Date.now());
  // Which question is currently active
  const activeRef = useRef<number>(0);

  // Dynamically grow the accumulated array if it is smaller than numQuestions
  if (accumulated.current.length < numQuestions) {
    const prevLen = accumulated.current.length;
    const extra = Array(numQuestions - prevLen).fill(0);
    accumulated.current = [...accumulated.current, ...extra];
  }

  const onQuestionChange = useCallback((newIndex: number) => {
    const now = Date.now();
    const elapsed = Math.round((now - startRef.current) / 1000);
    const prev = activeRef.current;

    if (prev >= 0 && prev < accumulated.current.length) {
      accumulated.current[prev] += elapsed;
    }

    activeRef.current = newIndex;
    startRef.current = now;
  }, []);

  // Call this just before submitting — flushes the currently active question's
  // time so the final question doesn't lose its unsaved elapsed time.
  const flush = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.round((now - startRef.current) / 1000);
    const curr = activeRef.current;
    if (curr >= 0 && curr < accumulated.current.length) {
      accumulated.current[curr] += elapsed;
    }
    startRef.current = now;
  }, []);

  const getTimePerQuestion = useCallback((): number[] => {
    return [...accumulated.current];
  }, []);

  return { onQuestionChange, flush, getTimePerQuestion };
}
