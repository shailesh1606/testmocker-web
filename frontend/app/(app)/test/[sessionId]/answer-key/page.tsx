"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

export default function AnswerKeyPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { addToast } = useToast();

  const [session, setSession] = useState<any>(null);
  const [correctAnswers, setCorrectAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionFormat, setOptionFormat] = useState('ABCD');

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedKeyPdfId, setUploadedKeyPdfId] = useState<string | null>(null);
  const [uploadedKeyFileName, setUploadedKeyFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error();
        setSession(data);
        setOptionFormat(data.option_format || "ABCD");
        setCorrectAnswers(Array(data.num_questions).fill(null).map((_, i) => ({
          type: data.question_types?.[i] || "mcq",
          value: ""
        })));
      } catch (err) {
        addToast("Error loading test", "error");
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [params.sessionId, addToast]);

  const handleUpdate = (idx: number, field: string, val: string) => {
    const copy = [...correctAnswers];
    copy[idx] = { ...copy[idx], [field]: val };
    if (field === 'type') copy[idx].value = '';
    setCorrectAnswers(copy);
  };

  const handleUploadKeyFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      addToast('Please upload a PDF file.', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setUploadedKeyPdfId(data.pdf_id);
      setUploadedKeyFileName(file.name);
      addToast('Answer Key uploaded successfully!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAutoExtract = async (answerKeyPdfId: string | null) => {
    setExtracting(true);
    try {
      const res = await fetch(`/api/answers/extract/${params.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_key_pdf_id: answerKeyPdfId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to extract answers");

      setCorrectAnswers(data.answers);
      setOptionFormat(data.option_format || "ABCD");
      addToast("Successfully extracted answers!", "success");
      setActiveTab('manual');
    } catch (err: any) {
      addToast(err.message || "Failed to auto-extract answer key.", "error");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        correct_answers: correctAnswers.map(c => c.value ? c : null)
      };

      const res = await fetch(`/api/sessions/${params.sessionId}/answer-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();

      router.push(`/results/${params.sessionId}`);
    } catch (err) {
      addToast("Failed to submit answer key", "error");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  const mcqOptions = optionFormat === '1234' ? ['1', '2', '3', '4'] : optionFormat === 'abcd' ? ['a', 'b', 'c', 'd'] : ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-pageBg p-6 pt-16 flex justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-textPrimary">Enter Answer Key</h1>
          <p className="text-textSecondary mt-2">Enter the correct answers to see your results.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-borderLight overflow-hidden">
          <div className="flex border-b border-borderLight">
            <button
              className={`flex-1 py-4 font-medium text-sm transition-colors ${activeTab === 'manual' ? 'text-primaryAccent border-b-2 border-primaryAccent' : 'text-textSecondary hover:bg-pageBg'}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual Entry
            </button>
            <button
              className={`flex-1 py-4 font-medium text-sm transition-colors ${activeTab === 'auto' ? 'text-primaryAccent border-b-2 border-primaryAccent' : 'text-textSecondary hover:bg-pageBg'}`}
              onClick={() => setActiveTab('auto')}
            >
              Auto Extract (AI)
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'auto' ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-4">🤖</span>
                <p className="text-textSecondary mb-6 max-w-sm mx-auto">
                  AI will attempt to extract the answer key from the uploaded PDF. This may not be 100% accurate.
                </p>
                <Button onClick={() => setShowUploadModal(true)} disabled={extracting}>
                  {extracting ? 'Extracting with AI...' : 'Extract with AI'}
                </Button>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-pageBg border-b border-borderLight shadow-sm">
                      <tr className="text-xs uppercase text-textSecondary font-medium">
                        <th className="py-3 px-4">Q.No</th>
                        <th className="py-3 px-4">Answer Type</th>
                        <th className="py-3 px-4">Answer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correctAnswers.map((ca, idx) => (
                        <tr key={idx} className={`border-b border-borderLight h-10 ${idx % 2 !== 0 ? 'bg-pageBg/30' : ''}`}>
                          <td className="py-2 px-4 text-sm font-medium">{idx + 1}</td>
                          <td className="py-2 px-4">
                            <select
                              className="text-xs border rounded p-1 w-full bg-white outline-none focus:border-primaryAccent"
                              value={ca.type}
                              onChange={(e) => handleUpdate(idx, 'type', e.target.value)}
                            >
                              <option value="mcq">MCQ</option>
                              <option value="numeric">Numeric</option>
                              <option value="text">Text</option>
                            </select>
                          </td>
                          <td className="py-2 px-4 min-w-[200px]">
                            {ca.type === 'mcq' ? (
                              <div className="flex bg-pageBg border border-borderLight rounded self-start inline-flex">
                                {mcqOptions.map(opt => (
                                  <button
                                    key={opt}
                                    onClick={() => handleUpdate(idx, 'value', opt)}
                                    className={`px-3 py-1 font-medium text-xs transition-colors rounded-none outline-none ${ca.value === opt ? 'bg-primaryAccent text-white' : 'text-textSecondary hover:bg-white'}`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input
                                className="border rounded px-2 py-1 flex-1 text-sm outline-none focus:border-primaryAccent w-full text-textPrimary"
                                value={ca.value || ''}
                                onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
                                placeholder="Enter value"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 pt-4 border-t border-borderLight">
                  <Button fullWidth onClick={handleSubmit}>View Results</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-borderLight flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-lg text-textPrimary">Have an answer key?</h3>
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                Upload it for more accurate extraction (Optional). If not provided, we will extract/solve using only the Question Paper.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-textPrimary block">Answer Key PDF (Optional)</label>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-borderLight rounded-lg p-6 text-center cursor-pointer hover:bg-pageBg/40 transition-colors ${uploadedKeyPdfId ? 'border-success bg-success/5' : ''}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleUploadKeyFile(e.target.files[0])}
                  className="hidden"
                  accept="application/pdf"
                  disabled={uploading}
                />
                {uploadedKeyFileName ? (
                  <div className="space-y-1">
                    <div className="text-success font-semibold text-xs">✓ Answer Key Loaded</div>
                    <div className="text-[10px] text-textSecondary truncate max-w-[280px] mx-auto">{uploadedKeyFileName}</div>
                  </div>
                ) : (
                  <div className="space-y-1 text-textSecondary text-[11px]">
                    {uploading ? (
                      <span className="animate-pulse">Uploading file...</span>
                    ) : (
                      <>
                        <span className="text-2xl block mb-1">🔑</span>
                        <span className="text-primaryAccent font-semibold hover:underline">Click to upload</span> Answer Key PDF
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-borderLight">
              <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowUploadModal(false);
                  handleAutoExtract(uploadedKeyPdfId);
                }}
                disabled={uploading}
              >
                Extract Answers
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
