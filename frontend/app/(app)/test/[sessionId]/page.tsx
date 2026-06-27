"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PdfViewer } from '@/components/test/PdfViewer';
import { CountdownTimer } from '@/components/test/CountdownTimer';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

export default function TestPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [session, setSession] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setSession(data);
        setAnswers(data.answers || Array(data.num_questions).fill(null));
        setMarkedForReview(Array(data.num_questions).fill(false));

        const tk = `test_start_${params.sessionId}`;
        let start = localStorage.getItem(tk);
        if (!start) {
          start = Math.floor(Date.now() / 1000).toString();
          localStorage.setItem(tk, start);
        }
        setStartedAt(parseInt(start));
      } catch (err) {
        addToast("Error loading test", "error");
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

  const handleToggleReview = () => {
    const m = [...markedForReview];
    m[currentIndex] = !m[currentIndex];
    setMarkedForReview(m);
  };

  const handleNext = () => {
    if (currentIndex < session.num_questions - 1) {
      setCurrentIndex(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const tt = Math.min(now - startedAt, session.time_limit_seconds);
      
      await fetch(`/api/sessions/${params.sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          question_types: session.question_types,
          time_taken_seconds: tt
        })
      });
      localStorage.removeItem(`test_start_${params.sessionId}`);
      router.push(`/test/${params.sessionId}/answer-key`);
    } catch(err) {
      addToast("Failed to submit", "error");
    }
  };

  if (loading || !session) return <div className="p-10 flex justify-center w-full min-h-screen items-center">Loading test environment...</div>;

  const cAns = answers[currentIndex];
  const cType = session.question_types[currentIndex] || "mcq";

  return (
    <div className="flex flex-col min-h-screen bg-pageBg w-full">
      {/* Top Header */}
      <div className="h-14 bg-white border-b border-borderLight px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-bold text-textPrimary flex items-center gap-2">
            TestMocker <span className="w-1.5 h-1.5 rounded-full bg-primaryAccent inline-block" />
          </div>
          <div className="hidden md:block px-3 py-1 bg-pageBg text-textSecondary uppercase font-medium text-xs rounded border border-borderLight">
            {session.exam_type}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <CountdownTimer totalSeconds={session.time_limit_seconds} startedAt={startedAt} onExpire={handleSubmit} />
          <Button onClick={handleSubmit} size="sm">Submit Test</Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[calc(100vh-56px)] w-full max-w-[1600px] mx-auto">
        
        {/* Left PDF Panel */}
        <div className="w-full md:w-[60%] h-[40%] md:h-full border-b md:border-b-0 md:border-r border-borderLight relative z-10 shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
            <PdfViewer pdfId={session.pdf_id} />
        </div>

        {/* Right Interactions Panel */}
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
            <h2 className="text-lg font-bold mb-6 pb-4 border-b border-borderLight text-textPrimary">Question {currentIndex + 1} of {session.num_questions}</h2>
            
            <div className="flex-1 flex flex-col justify-center">
              {cType === 'mcq' && (
                <div className="flex flex-col gap-3">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleUpdateCurrentAnswer(opt)}
                      className={`h-12 w-full flex items-center px-4 border rounded font-medium transition-colors ${cAns?.value === opt ? 'border-primaryAccent bg-primaryAccent/5 ring-1 ring-primaryAccent' : 'border-borderLight bg-white hover:bg-pageBg'}`}
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 text-xs ${cAns?.value === opt ? 'border-primaryAccent bg-primaryAccent text-white' : 'border-borderLight'}`}>
                        {cAns?.value === opt && "✓"}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {cType === 'numeric' && (
                <Input 
                  type="text" 
                  placeholder="Enter numeric answer (e.g. 3.14)" 
                  value={cAns?.value || ''} 
                  onChange={(e) => handleUpdateCurrentAnswer(e.target.value)}
                />
              )}
              {cType === 'text' && (
                <Input 
                  type="text" 
                  placeholder="Enter text answer" 
                  value={cAns?.value || ''} 
                  onChange={(e) => handleUpdateCurrentAnswer(e.target.value)}
                />
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-borderLight flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="ghost" onClick={() => handleUpdateCurrentAnswer(null)} size="sm" className="hidden sm:inline-flex">Clear Response</Button>
                <Button variant="outline" onClick={handleToggleReview} size="sm">
                  {markedForReview[currentIndex] ? 'Unmark Review' : 'Mark for Review'}
                </Button>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0} size="sm">Prev</Button>
                <Button onClick={handleNext} disabled={currentIndex === session.num_questions - 1} size="sm">Save & Next</Button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
