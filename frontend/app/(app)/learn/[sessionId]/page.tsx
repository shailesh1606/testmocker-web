"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PdfViewer } from '@/components/test/PdfViewer';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

export default function LearnPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [session, setSession] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  const [hintLoading, setHintLoading] = useState(false);
  const [currentHintText, setCurrentHintText] = useState<string|null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setSession(data);
        setAnswers(data.answers || Array(data.num_questions).fill(null));
        setMarkedForReview(Array(data.num_questions).fill(false));
        setHintsUsed(data.hints_used || {});
      } catch (err) {
        addToast("Error loading learning session", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.sessionId, addToast]);

  const saveAnswer = useCallback(async (idx: number, ans: any) => {
    try {
      await fetch(`/api/sessions/${params.sessionId}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: idx, answer: ans })
      });
    } catch(err) {}
  }, [params.sessionId]);

  const handleUpdateCurrentAnswer = (val: string | null) => {
    const newAnswers = [...answers];
    const type = session.question_types[currentIndex] || "mcq";
    const update = val !== null ? { type, value: val } : null;
    newAnswers[currentIndex] = update;
    setAnswers(newAnswers);
    saveAnswer(currentIndex, update);
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const res = await fetch('/api/hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: params.sessionId, question_index: currentIndex })
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setCurrentHintText(data.hint);
      setHintsUsed(p => ({ ...p, [currentIndex]: (p[currentIndex] || 0) + 1 }));
    } catch (err) {
      addToast("AI Hint failed to load.", "error");
    } finally {
      setHintLoading(false);
    }
  };

  useEffect(() => {
    // Reset hint text when question changes
    setCurrentHintText(null);
  }, [currentIndex]);

  const handleFinish = async () => {
    try {
      await fetch(`/api/sessions/${params.sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          question_types: session.question_types,
          time_taken_seconds: 0
        })
      });
      router.push(`/test/${params.sessionId}/answer-key`);
    } catch (err) {
      addToast("Failed to finish", "error");
    }
  };

  if (loading || !session) return <div className="p-10 text-center">Loading learning environment...</div>;

  const cAns = answers[currentIndex];
  const cType = session.question_types[currentIndex] || "mcq";
  const usedHintCount = hintsUsed[currentIndex] || 0;

  return (
    <div className="flex flex-col min-h-screen bg-pageBg w-full">
      <div className="h-14 bg-white border-b border-borderLight px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-bold text-textPrimary flex items-center gap-2">
            TestMocker <span className="w-1.5 h-1.5 rounded-full bg-review inline-block" />
            <span className="ml-2 font-medium text-xs rounded border border-review text-review px-2 uppercase text-xs hidden md:inline-block">Learning Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleFinish} size="sm">Finish & See Report</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[calc(100vh-56px)] w-full max-w-[1600px] mx-auto">
        
        <div className="w-full md:w-[60%] h-[40%] md:h-full border-b md:border-b-0 md:border-r border-borderLight relative z-10 shrink-0">
            <PdfViewer pdfId={session.pdf_id} />
        </div>

        <div className="w-full md:w-[40%] h-[60%] md:h-full bg-pageBg flex flex-col p-4 overflow-y-auto">
          <div className="shrink-0 mb-6">
            <QuestionPalette 
              totalQuestions={session.num_questions} 
              currentIndex={currentIndex}
              answers={answers}
              markedForReview={markedForReview}
              onSelect={setCurrentIndex}
            />
          </div>

          <div className="bg-white border border-borderLight rounded-lg p-6 flex-1 flex flex-col shadow-sm">
            <h2 className="text-lg font-bold mb-6 pb-4 border-b border-borderLight">Question {currentIndex + 1}</h2>
            
            <div className="flex-1 flex flex-col">
              {cType === 'mcq' && (
                <div className="flex flex-col gap-3">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleUpdateCurrentAnswer(opt)}
                      className={`h-12 w-full flex items-center px-4 border rounded font-medium transition-colors ${cAns?.value === opt ? 'border-primaryAccent bg-primaryAccent/5 ring-1 ring-primaryAccent' : 'border-borderLight bg-white hover:bg-pageBg'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {cType === 'numeric' && <Input type="text" placeholder="Numeric answer" value={cAns?.value || ''} onChange={(e) => handleUpdateCurrentAnswer(e.target.value)} />}
              {cType === 'text' && <Input type="text" placeholder="Text answer" value={cAns?.value || ''} onChange={(e) => handleUpdateCurrentAnswer(e.target.value)} />}

              {/* Hint Logic */}
              <div className="mt-8">
                <Button variant="outline" onClick={handleGetHint} disabled={hintLoading} className="mb-4">
                  💡 {usedHintCount > 0 ? 'Get Another Hint' : 'Get Hint'}
                </Button>

                {hintLoading && <div className="h-2 w-full bg-borderLight rounded overflow-hidden animate-pulse"><div className="h-full bg-primaryAccent w-1/2"></div></div>}
                
                {currentHintText && !hintLoading && (
                  <div className="bg-primaryAccent/5 border border-primaryAccent/20 rounded p-4 text-sm text-textPrimary leading-relaxed">
                    <strong className="text-primaryAccent block mb-1">AI Hint</strong>
                    {currentHintText}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-borderLight flex items-center justify-end gap-2 text-right w-full">
                <Button variant="secondary" onClick={() => setCurrentIndex(c => Math.max(0, c-1))} disabled={currentIndex === 0} size="sm">Prev</Button>
                <Button onClick={() => setCurrentIndex(c => Math.min(session.num_questions-1, c+1))} disabled={currentIndex === session.num_questions - 1} size="sm">Save & Next</Button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
