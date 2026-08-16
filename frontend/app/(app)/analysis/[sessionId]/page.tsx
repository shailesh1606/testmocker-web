"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/ToastProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TimePerQuestionChart } from '@/components/analysis/TimePerQuestionChart';

export default function AnalysisPage({ params }: { params: { sessionId: string } }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analysis/topics/${params.sessionId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error();
        setTopics(data.topics || []);

        const sessionRes = await fetch(`/api/sessions/${params.sessionId}`);
        const sessionD = await sessionRes.json();
        if (!sessionRes.ok) throw new Error();
        setSessionData(sessionD);
      } catch (err) {
        addToast("Analysis failed to load", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [params.sessionId, addToast]);

  const COLORS = ['#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  const groupBySection = topics.reduce((acc, t) => {
    if (!acc[t.section]) acc[t.section] = [];
    acc[t.section].push(t);
    return acc;
  }, {});

  const timePerQuestion: number[] = sessionData?.time_per_question ?? [];
  const answers = sessionData?.answers ?? [];
  const correctAnswers = sessionData?.correct_answers ?? [];

  let correctTime = 0;
  let incorrectTime = 0;
  let unattemptedTime = 0;

  timePerQuestion.forEach((seconds, i) => {
    const userAns = answers[i];
    const correctAns = correctAnswers[i];
    const attempted = userAns !== null && userAns !== undefined && userAns.value !== null && userAns.value !== undefined && String(userAns.value).trim() !== "";

    if (!attempted) {
      unattemptedTime += seconds;
    } else {
      const correct =
        correctAns !== null &&
        correctAns !== undefined &&
        String(userAns?.value).trim().toLowerCase() === String(correctAns?.value).trim().toLowerCase();

      if (correct) {
        correctTime += seconds;
      } else {
        incorrectTime += seconds;
      }
    }
  });

  const barChartData = [
    { name: "Correct", time: parseFloat((correctTime / 60).toFixed(1)), fill: "#22C55E" },
    { name: "Incorrect", time: parseFloat((incorrectTime / 60).toFixed(1)), fill: "#EF4444" },
    { name: "Unattempted", time: parseFloat((unattemptedTime / 60).toFixed(1)), fill: "#9CA3AF" }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar
          title="Question Paper Analysis"
          rightNode={<Link href={`/results/${params.sessionId}`}><Button size="sm" variant="outline">Back to Results</Button></Link>}
        />

        <div className="p-6 md:p-10 flex-1 flex flex-col w-full max-w-7xl mx-auto">
          {loading ? (
            <div className="m-auto text-center animate-pulse">
              <span className="text-5xl block mb-6">🤖</span>
              <h2 className="text-xl font-bold text-textPrimary mb-2">Analyzing your question paper with AI...</h2>
              <p className="text-textSecondary max-w-sm mx-auto">Extracting topics, mapping conceptual distribution, and categorizing difficulty.</p>
              <div className="mt-8 max-w-xs mx-auto"><ProgressBar progress={60} color="bg-primaryAccent" /></div>
            </div>
          ) : topics.length === 0 ? (
            <div className="m-auto text-center">
              <span className="text-5xl block mb-6">⚠️</span>
              <h2 className="text-xl font-bold">Analysis failed</h2>
              <button className="mt-4 text-primaryAccent hover:underline" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row gap-8">

                {/* Chart */}
                <div className="lg:w-[40%] bg-white border border-borderLight shadow-sm rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-6">Topic Distribution</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topics} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                          {topics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Time Spent Breakdown Bar Chart */}
                <div className="lg:w-[60%] bg-white border border-borderLight shadow-sm rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-6">Time Spent by Question Status</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Time Spent (minutes)', angle: -90, position: 'insideLeft', offset: 0 }} />
                        <Tooltip formatter={(value: any) => [`${value} min`, 'Time Spent']} />
                        <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {timePerQuestion.length > 0 && (
                <TimePerQuestionChart
                  timePerQuestion={timePerQuestion}
                  answers={sessionData.answers ?? []}
                  correctAnswers={sessionData.correct_answers ?? []}
                />
              )}

              {timePerQuestion.length === 0 && (
                <div className="bg-white border border-borderLight rounded-lg p-6 text-center text-sm text-textSecondary shadow-sm">
                  No time tracking data available for this session.
                  <br />
                  <span className="text-xs">(Only available for tests taken after this feature was added.)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
