"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

export default function CreateTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Files
  const [qpFileName, setQpFileName] = useState<string | null>(null);
  const [qpPdfId, setQpPdfId] = useState<string | null>(null);
  const [akFileName, setAkFileName] = useState<string | null>(null);
  const [akPdfId, setAkPdfId] = useState<string | null>(null);

  // Test Settings
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('JEE Mains');
  const [numQuestions, setNumQuestions] = useState(75);
  const [totalTime, setTotalTime] = useState(180);
  const [mpc, setMpc] = useState(4.0);
  const [nmpw, setNmpw] = useState(-1.0);

  // Answers State
  const [correctAnswers, setCorrectAnswers] = useState<any[]>([]);
  const [optionFormat, setOptionFormat] = useState('ABCD');
  const [extracting, setExtracting] = useState(false);

  // Student details
  const [studentQuery, setStudentQuery] = useState('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [searchingStudent, setSearchingStudent] = useState(false);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const akInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const studentIdParam = searchParams.get('studentId');
    if (studentIdParam) {
      setStudentQuery(studentIdParam);
      const lookupStudent = async () => {
        setSearchingStudent(true);
        try {
          const res = await fetch(`/api/mentors/students/${encodeURIComponent(studentIdParam)}`);
          const data = await res.json();
          if (res.ok) {
            setFoundStudent(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingStudent(false);
        }
      };
      lookupStudent();
    }
  }, [searchParams]);

  const handleExamTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setExamType(val);
    if (val === 'JEE Mains') { setNumQuestions(75); setTotalTime(180); setMpc(4); setNmpw(-1); }
    else if (val === 'JEE Advanced') { setNumQuestions(108); setTotalTime(360); setMpc(3); setNmpw(-1); }
    else if (val === 'NEET') { setNumQuestions(180); setTotalTime(200); setMpc(4); setNmpw(-1); }
    else if (val === 'Custom') { setNumQuestions(50); setTotalTime(60); setMpc(1); setNmpw(0); }
  };

  const handleUploadFile = async (file: File, type: 'qp' | 'ak') => {
    if (file.type !== 'application/pdf') {
      addToast('Please upload a PDF file.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      if (type === 'qp') {
        setQpPdfId(data.pdf_id);
        setQpFileName(file.name);
        addToast('Question Paper uploaded successfully!', 'success');
      } else {
        setAkPdfId(data.pdf_id);
        setAkFileName(file.name);
        addToast('Answer Key uploaded successfully!', 'success');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!studentQuery.trim()) return;
    setSearchingStudent(true);
    setFoundStudent(null);
    try {
      const res = await fetch(`/api/mentors/students/${encodeURIComponent(studentQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Student not found");
      setFoundStudent(data);
      addToast("Student verified successfully!", "success");
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setSearchingStudent(false);
    }
  };

  const startAnswerExtraction = async () => {
    setStep(3);
    setExtracting(true);
    try {
      const res = await fetch('/api/mentors/tests/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_id: qpPdfId,
          answer_key_pdf_id: akPdfId,
          num_questions: numQuestions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to extract answers");
      setCorrectAnswers(data.answers);
      setOptionFormat(data.option_format || "ABCD");
      addToast("AI Answer Key extraction complete!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to extract answers automatically.", "error");
      setCorrectAnswers(Array(numQuestions).fill(null).map(() => ({ type: 'mcq', value: '' })));
      setOptionFormat("ABCD");
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateAnswer = (idx: number, field: string, val: string) => {
    const copy = [...correctAnswers];
    copy[idx] = { ...copy[idx], [field]: val };
    if (field === 'type') copy[idx].value = '';
    setCorrectAnswers(copy);
  };

  const handleFinishAndRecommend = async () => {
    if (!title.trim()) {
      addToast("Please enter a test title.", "error");
      return;
    }
    if (!qpPdfId) {
      addToast("Question paper PDF is required.", "error");
      return;
    }
    if (!foundStudent) {
      addToast("Please select and verify a student first.", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Create mentor test
      const testRes = await fetch('/api/mentors/tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          exam_type: examType,
          num_questions: numQuestions,
          time_limit_seconds: totalTime * 60,
          marks_per_correct: mpc,
          negative_mark: nmpw,
          pdf_id: qpPdfId,
          answer_key_pdf_id: akPdfId,
          correct_answers: correctAnswers.map(c => c.value ? c : null),
          option_format: optionFormat
        })
      });
      const testData = await testRes.json();
      if (!testRes.ok) throw new Error(testData.detail || "Failed to create mock test");

      // 2. Recommend test to student
      const recRes = await fetch('/api/mentors/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: testData.test_id,
          student_id: foundStudent.id
        })
      });
      if (!recRes.ok) {
        const recData = await recRes.json();
        throw new Error(recData.detail || "Failed to assign test to student");
      }

      addToast("Mock test assigned successfully!", "success");
      router.push('/mentor/assignments');
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const mcqOptions = optionFormat === '1234' ? ['1', '2', '3', '4'] : optionFormat === 'abcd' ? ['a', 'b', 'c', 'd'] : ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar title="Create & Assign Mock Test" />

        <div className="p-6 md:p-10 flex-1 w-full max-w-3xl mx-auto animate-fade-in">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 text-sm font-semibold border-b border-borderLight pb-4 flex-wrap gap-2">
            <span className={step === 1 ? 'text-primaryAccent font-bold' : 'text-textSecondary'}>1. Upload PDFs</span>
            <span className="text-textSecondary/40">→</span>
            <span className={step === 2 ? 'text-primaryAccent font-bold' : 'text-textSecondary'}>2. Configure Test</span>
            <span className="text-textSecondary/40">→</span>
            <span className={step === 3 ? 'text-primaryAccent font-bold' : 'text-textSecondary'}>3. Review Answer Key</span>
            <span className="text-textSecondary/40">→</span>
            <span className={step === 4 ? 'text-primaryAccent font-bold' : 'text-textSecondary'}>4. Assign to Student</span>
          </div>

          {/* STEP 1: UPLOAD PDFs */}
          {step === 1 && (
            <div className="bg-white p-6 md:p-8 rounded-lg border border-borderLight shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-textPrimary mb-1">Upload Exam Materials</h2>
                <p className="text-xs text-textSecondary">Attach the question paper and an optional answer key to proceed.</p>
              </div>

              {/* Question Paper PDF */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-textPrimary block">Question Paper PDF *</label>
                <div
                  onClick={() => qpInputRef.current?.click()}
                  className="border-2 border-dashed border-borderLight rounded-lg p-6 text-center cursor-pointer hover:bg-pageBg/40 transition-colors"
                >
                  <input
                    type="file"
                    ref={qpInputRef}
                    onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], 'qp')}
                    className="hidden"
                    accept="application/pdf"
                  />
                  {qpFileName ? (
                    <div className="space-y-1">
                      <div className="text-success font-semibold text-sm">✓ Question Paper Loaded</div>
                      <div className="text-xs text-textSecondary truncate max-w-md mx-auto">{qpFileName}</div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-textSecondary text-xs">
                      <span className="text-2xl block mb-1">📄</span>
                      <span className="text-primaryAccent font-semibold hover:underline">Click to upload</span> Question Paper PDF
                    </div>
                  )}
                </div>
              </div>

              {/* Answer Key PDF */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-textPrimary block">Answer Key PDF (Optional)</label>
                <div
                  onClick={() => akInputRef.current?.click()}
                  className="border-2 border-dashed border-borderLight rounded-lg p-6 text-center cursor-pointer hover:bg-pageBg/40 transition-colors"
                >
                  <input
                    type="file"
                    ref={akInputRef}
                    onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0], 'ak')}
                    className="hidden"
                    accept="application/pdf"
                  />
                  {akFileName ? (
                    <div className="space-y-1">
                      <div className="text-success font-semibold text-sm">✓ Answer Key Attached</div>
                      <div className="text-xs text-textSecondary truncate max-w-md mx-auto">{akFileName}</div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-textSecondary text-xs">
                      <span className="text-2xl block mb-1">🔑</span>
                      <span className="text-primaryAccent font-semibold hover:underline">Click to upload</span> Answer Key PDF
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-textSecondary">If attached, the test will be graded automatically upon submission.</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-borderLight/60">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!qpPdfId || loading}
                  className="px-6"
                >
                  Configure Test Settings
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE SETTINGS */}
          {step === 2 && (
            <div className="bg-white p-6 md:p-8 rounded-lg border border-borderLight shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-textPrimary mb-1">Configure Exam Parameters</h2>
                <p className="text-xs text-textSecondary">Provide a title and configure grading rules for this mock test.</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Test Title *"
                  placeholder="e.g. JEE Mains physics - Test 1"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-textPrimary">Exam Type</label>
                    <select
                      value={examType}
                      onChange={handleExamTypeChange}
                      className="w-full px-3 py-2 border border-borderLight rounded text-sm bg-white focus:outline-none focus:border-primaryAccent focus:ring-1 focus:ring-primaryAccent"
                    >
                      <option value="JEE Mains">JEE Mains</option>
                      <option value="JEE Advanced">JEE Advanced</option>
                      <option value="NEET">NEET</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <Input
                    label="Number of Questions"
                    type="number"
                    value={numQuestions}
                    onChange={e => setNumQuestions(parseInt(e.target.value) || 0)}
                    disabled={examType !== 'Custom'}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Time Limit (mins)"
                    type="number"
                    value={totalTime}
                    onChange={e => setTotalTime(parseInt(e.target.value) || 0)}
                    disabled={examType !== 'Custom'}
                  />
                  <Input
                    label="Marks per Correct"
                    type="number"
                    step="0.5"
                    value={mpc}
                    onChange={e => setMpc(parseFloat(e.target.value) || 0)}
                    disabled={examType !== 'Custom'}
                  />
                  <Input
                    label="Negative Mark"
                    type="number"
                    step="0.5"
                    value={nmpw}
                    onChange={e => setNmpw(parseFloat(e.target.value) || 0)}
                    disabled={examType !== 'Custom'}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-borderLight/60">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={startAnswerExtraction} className="px-6" disabled={!title.trim()}>Extract & Review Answers</Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ANSWER KEY */}
          {step === 3 && (
            <div className="bg-white p-6 md:p-8 rounded-lg border border-borderLight shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-textPrimary mb-1">Verify AI Extracted Answers</h2>
                <p className="text-xs text-textSecondary">Review and correct the correct answers before final assignment.</p>
              </div>

              {extracting ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-8 h-8 border-4 border-primaryAccent border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-textSecondary animate-pulse">
                    Extracting answers from your question paper...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border border-borderLight rounded shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="sticky top-0 bg-pageBg border-b border-borderLight shadow-sm z-10">
                        <tr className="text-xs uppercase text-textSecondary font-medium">
                          <th className="py-3 px-4">Q.No</th>
                          <th className="py-3 px-4">Answer Type</th>
                          <th className="py-3 px-4">Correct Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {correctAnswers.map((ca, idx) => (
                          <tr key={idx} className={`border-b border-borderLight h-10 ${idx % 2 !== 0 ? 'bg-pageBg/30' : ''}`}>
                            <td className="py-2 px-4 font-medium">{idx + 1}</td>
                            <td className="py-2 px-4">
                              <select
                                className="text-xs border rounded p-1 w-full bg-white outline-none focus:border-primaryAccent"
                                value={ca.type}
                                onChange={(e) => handleUpdateAnswer(idx, 'type', e.target.value)}
                              >
                                <option value="mcq">MCQ</option>
                                <option value="numeric">Numeric</option>
                                <option value="text">Text</option>
                              </select>
                            </td>
                            <td className="py-2 px-4 min-w-[200px]">
                              {ca.type === 'mcq' ? (
                                <div className=" bg-pageBg border border-borderLight rounded self-start inline-flex">
                                  {mcqOptions.map(opt => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleUpdateAnswer(idx, 'value', opt)}
                                      className={`px-3 py-1 font-medium text-xs transition-colors rounded-none outline-none ${ca.value === opt ? 'bg-primaryAccent text-white' : 'text-textSecondary hover:bg-white'}`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  className="border rounded px-2 py-1 text-sm outline-none focus:border-primaryAccent w-full text-textPrimary bg-white"
                                  value={ca.value || ''}
                                  onChange={(e) => handleUpdateAnswer(idx, 'value', e.target.value)}
                                  placeholder="Enter value"
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-borderLight/60">
                    <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={() => setStep(4)} className="px-6">Next: Assign to Student</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ASSIGN TO STUDENT */}
          {step === 4 && (
            <div className="bg-white p-6 md:p-8 rounded-lg border border-borderLight shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-textPrimary mb-1">Verify Student Assignment</h2>
                <p className="text-xs text-textSecondary">Search and link this test template to a specific student user.</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Student ID or Email *"
                      placeholder="e.g. 6a7d6cb42131b764d..."
                      value={studentQuery}
                      onChange={e => setStudentQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleLookup}
                    disabled={searchingStudent}
                    className="self-end h-[42px] px-6"
                  >
                    {searchingStudent ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                {foundStudent ? (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex items-center justify-between animate-fade-in">
                    <div>
                      <div className="font-bold text-success text-sm">✓ Student Verified</div>
                      <div className="text-xs text-textPrimary font-semibold mt-1">{foundStudent.name} ({foundStudent.email})</div>
                      <div className="text-[10px] text-textSecondary font-mono mt-0.5">ID: {foundStudent.id}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-pageBg border border-borderLight rounded-lg p-4 text-center text-xs text-textSecondary">
                    Enter the student's ID or email above and click Verify.
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-borderLight/60">
                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                <Button
                  onClick={handleFinishAndRecommend}
                  disabled={loading || !foundStudent}
                  className="px-6"
                >
                  {loading ? 'Assigning...' : 'Create & Assign Test'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
