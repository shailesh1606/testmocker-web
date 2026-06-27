"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function ResultsPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error();
        setSession(data);
      } catch (err) {
        addToast("Error loading results", "error");
      }
    };
    loadData();
  }, [params.sessionId, addToast]);

  if (!session || !session.results) return <div className="p-10 text-center">Loading results...</div>;

  const res = session.results;
  const pieData = [
    { name: 'Correct', value: res.correct, color: '#22C55E' },
    { name: 'Wrong', value: res.wrong, color: '#EF4444' },
    { name: 'Not Attempted', value: res.not_attempted, color: '#E5E7EB' }
  ].filter(d => d.value > 0);

  const totalPossible = session.num_questions * session.marks_per_correct;
  const accuracy = res.correct + res.wrong > 0 ? ((res.correct / (res.correct + res.wrong)) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar title="Test Results" />
        
        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
          {/* Top Summary Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-borderLight p-8 mb-8 text-center flex flex-col items-center">
            <div className="uppercase text-xs font-bold tracking-widest text-textSecondary mb-2">{session.exam_type}</div>
            <div className="text-5xl font-extrabold text-primaryAccent mb-6">
              {res.score} <span className="text-2xl text-textSecondary font-medium">/ {totalPossible}</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="px-4 py-2 bg-success/10 border border-success/20 rounded font-medium text-success text-sm flex gap-2"><span className="text-textPrimary text-opacity-50">✓</span> {res.correct} Correct</div>
              <div className="px-4 py-2 bg-danger/10 border border-danger/20 rounded font-medium text-danger text-sm flex gap-2"><span>✗</span> {res.wrong} Wrong</div>
              <div className="px-4 py-2 bg-pageBg border border-borderLight rounded font-medium text-textSecondary text-sm flex gap-2"><span>—</span> {res.not_attempted} Unattempted</div>
              <div className="px-4 py-2 bg-warning/10 border border-warning/20 rounded font-medium text-warning text-sm flex gap-2"><span>🎯</span> {accuracy}% Accuracy</div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column (Table) */}
            <div className="lg:w-[60%] bg-white rounded-lg shadow-sm border border-borderLight overflow-hidden flex flex-col max-h-[800px]">
              <div className="p-4 border-b border-borderLight font-bold">Answer Analysis</div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-pageBg shadow-sm">
                    <tr className="text-textSecondary uppercase text-[11px] font-bold">
                      <th className="py-3 px-4">Q.No</th>
                      <th className="py-3 px-4">Your Answer</th>
                      <th className="py-3 px-4">Correct Answer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.details.map((d: any) => {
                      let rowCls = "border-b border-borderLight ";
                      if (d.status === '✓') rowCls += "bg-success/5";
                      else if (d.status === '✗') rowCls += "bg-danger/5";
                      
                      return (
                        <tr key={d.q_no} className={rowCls}>
                          <td className="py-3 px-4 font-medium">{d.q_no}</td>
                          <td className="py-3 px-4">{d.user_answer !== null ? String(d.user_answer).toUpperCase() : '—'}</td>
                          <td className="py-3 px-4 font-medium">{d.correct_answer !== null ? String(d.correct_answer).toUpperCase() : '?'}</td>
                          <td className="py-3 px-4">
                            {d.status === '✓' ? <span className="text-success font-bold">✓</span> : d.status === '✗' ? <span className="text-danger font-bold">✗</span> : <span className="text-textSecondary">—</span>}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">{d.marks > 0 ? `+${d.marks}` : d.marks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column (Charts) */}
            <div className="lg:w-[40%] flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-borderLight p-6">
                <h3 className="font-bold mb-4">Performance Breakdown</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 flex flex-col gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-borderLight">
                    <span className="text-textSecondary">Time Taken</span>
                    <span className="font-semibold">{Math.floor((session.time_taken_seconds || 0) / 60)}m {(session.time_taken_seconds || 0) % 60}s</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-borderLight">
                    <span className="text-textSecondary">Total Attempted</span>
                    <span className="font-semibold">{res.correct + res.wrong} / {session.num_questions}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-borderLight">
                    <span className="text-textSecondary">Negative Marks</span>
                    <span className="font-semibold text-danger">-{res.negative_marks_total}</span>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                fullWidth 
                onClick={() => router.push(`/analysis/${params.sessionId}`)}
              >
                Question Paper Analysis
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
