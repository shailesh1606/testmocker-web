"use client";

import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';

export default function NewTestWizard() {
  const [step, setStep] = useState(1);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [examType, setExamType] = useState('JEE Mains');
  const [numQuestions, setNumQuestions] = useState(75);
  const [totalTime, setTotalTime] = useState(180);
  const [mpc, setMpc] = useState(4.0);
  const [nmpw, setNmpw] = useState(-1.0);
  const [mode, setMode] = useState<'test'|'learning'>('test');
  
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const handleExamTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setExamType(val);
    if (val === 'JEE Mains') { setNumQuestions(75); setTotalTime(180); setMpc(4); setNmpw(-1); }
    else if (val === 'JEE Advanced') { setNumQuestions(108); setTotalTime(360); setMpc(3); setNmpw(-1); }
    else if (val === 'NEET') { setNumQuestions(180); setTotalTime(200); setMpc(4); setNmpw(-1); }
    else if (val === 'Custom') { setNumQuestions(50); setTotalTime(60); setMpc(1); setNmpw(0); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      addToast('Please select a PDF file.', 'error');
      return;
    }
    
    setFileName(selected.name);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selected);
      
      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData
        // auth token will be implicitly sent if it's the rewrite! Wait, wait... the Next rewrite to /api/ pdf upload WILL include cookies. and our py read cookie.
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      
      setPdfId(data.pdf_id);
      addToast('PDF Uploaded successfully!', 'success');
      setStep(2);
    } catch(err: any) {
      addToast(err.message, 'error');
      setFileName(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_id: pdfId,
          exam_type: examType,
          num_questions: numQuestions,
          time_limit_seconds: totalTime * 60,
          marks_per_correct: mpc,
          negative_mark: nmpw,
          mode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create session");
      
      if (mode === 'learning') {
        router.push(`/learn/${data.session_id}`);
      } else {
        router.push(`/test/${data.session_id}`);
      }
    } catch(err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar title="New Test Setup" />
        <div className="p-6 flex-1 flex flex-col items-center max-w-4xl mx-auto w-full">
          
          <div className="w-full mb-8 flex items-center justify-between">
            <div className={`flex-1 text-center font-medium py-2 border-b-2 ${step >= 1 ? 'border-primaryAccent text-primaryAccent' : 'border-borderLight text-textSecondary'}`}>1. Upload Paper</div>
            <div className={`flex-1 text-center font-medium py-2 border-b-2 ${step >= 2 ? 'border-primaryAccent text-primaryAccent' : 'border-borderLight text-textSecondary'}`}>2. Configure Exam</div>
            <div className={`flex-1 text-center font-medium py-2 border-b-2 ${step >= 3 ? 'border-primaryAccent text-primaryAccent' : 'border-borderLight text-textSecondary'}`}>3. Mode Selection</div>
          </div>

          <div className="w-full bg-white shadow-sm border border-borderLight rounded p-8">
            {step === 1 && (
              <div className="text-center">
                <div 
                  className={`border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer ${loading ? 'border-borderLight bg-pageBg' : 'border-primaryAccent/50 hover:bg-primaryAccent/5'}`}
                  onClick={() => !loading && fileInput.current?.click()}
                >
                  <input type="file" className="hidden" ref={fileInput} onChange={handleFileChange} accept=".pdf" />
                  <span className="text-4xl mb-4 block">📄</span>
                  {loading ? (
                    <p className="text-textSecondary font-medium">Uploading...</p>
                  ) : fileName ? (
                    <div className="flex items-center justify-center gap-2 text-success font-medium">
                      <span>✓</span> {fileName}
                    </div>
                  ) : (
                    <p className="text-textSecondary font-medium">Drag your question paper PDF here or click to browse</p>
                  )}
                </div>
                {fileName && !loading && (
                    <Button className="mt-8" onClick={() => setStep(2)}>Continue Configuration</Button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-[13px] font-medium text-textPrimary">Exam Type</label>
                  <select 
                    className="px-3 py-2 bg-white border rounded text-sm text-textPrimary border-borderLight focus:outline-none focus:border-primaryAccent focus:ring-1 focus:ring-primaryAccent"
                    value={examType} onChange={handleExamTypeChange}
                  >
                    <option value="JEE Mains">JEE Mains</option>
                    <option value="JEE Advanced">JEE Advanced</option>
                    <option value="NEET">NEET</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Number of Questions" type="number" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} />
                  <Input label="Total Time (minutes)" type="number" value={totalTime} onChange={e => setTotalTime(Number(e.target.value))} />
                  <Input label="Marks per Correct Answer" type="number" value={mpc} step="0.1" onChange={e => setMpc(Number(e.target.value))} />
                  <Input label="Negative Marks per Wrong Answer" type="number" value={nmpw} step="0.1" onChange={e => setNmpw(Number(e.target.value))} />
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Continue to Mode Selection</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    className={`border-2 rounded p-6 cursor-pointer transition-colors ${mode === 'test' ? 'border-primaryAccent bg-primaryAccent/5' : 'border-borderLight hover:border-textSecondary'}`}
                    onClick={() => setMode('test')}
                  >
                    <span className="text-3xl block mb-2">⏱️</span>
                    <h3 className="font-bold text-lg mb-1">Test Mode</h3>
                    <p className="text-sm text-textSecondary">Timed exam simulation. Submit at the end for results.</p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded p-6 cursor-pointer transition-colors ${mode === 'learning' ? 'border-primaryAccent bg-primaryAccent/5' : 'border-borderLight hover:border-textSecondary'}`}
                    onClick={() => setMode('learning')}
                  >
                    <span className="text-3xl block mb-2">📖</span>
                    <h3 className="font-bold text-lg mb-1">Learning Mode</h3>
                    <p className="text-sm text-textSecondary">Get AI-powered hints while you answer. No timer stress.</p>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={handleCreateSession} disabled={loading}>
                    {loading ? 'Starting...' : 'Start Session'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
