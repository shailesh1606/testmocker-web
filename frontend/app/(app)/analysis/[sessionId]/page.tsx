"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/ToastProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AnalysisPage({ params }: { params: { sessionId: string } }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analysis/topics/${params.sessionId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error();
        setTopics(data.topics || []);
      } catch(err) {
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

              {/* Topics Breakdown */}
              <div className="lg:w-[60%] flex flex-col gap-6">
                {Object.keys(groupBySection).map((section) => (
                  <div key={section} className="bg-white border border-borderLight shadow-sm rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4 text-primaryAccent">{section}</h3>
                    <div className="flex flex-col gap-4">
                      {groupBySection[section].map((t: any, i: number) => {
                        const totalSec = groupBySection[section].reduce((s: number, i: any) => s + i.count, 0);
                        const pct = Math.round((t.count / totalSec) * 100);
                        return (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between text-sm font-medium">
                              <span>{t.name}</span>
                              <span className="text-textSecondary">{t.count} questions ({pct}%)</span>
                            </div>
                            <ProgressBar progress={pct} color="bg-primaryAccent" height="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
