"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

export default function RecommendedTestsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRecId, setStartingRecId] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const loadRecommendations = async () => {
    try {
      const res = await fetch('/api/students/recommendations');
      if (!res.ok) throw new Error("Failed to load recommendations");
      const data = await res.json();
      // Sort recommendations by date descending
      const sorted = data.sort((a: any, b: any) => new Date(b.date_recommended).getTime() - new Date(a.date_recommended).getTime());
      setRecommendations(sorted);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleStart = async (recId: string) => {
    setStartingRecId(recId);
    try {
      const res = await fetch(`/api/students/recommendations/${recId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to start test");
      const data = await res.json();
      router.push(`/test/${data.session_id}`);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setStartingRecId(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-success/10 text-success border-success/20';
    if (status === 'attempted') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-primaryAccent/10 text-primaryAccent border-primaryAccent/20';
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar title="Mentor Recommended Tests" />
        
        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
          {loading ? (
            <div className="p-10 text-center text-textSecondary">Loading recommendations...</div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white border border-borderLight rounded-lg p-12 text-center text-textSecondary text-sm shadow-sm max-w-2xl mx-auto mt-10">
              <span className="text-4xl block mb-4">👨‍🏫</span>
              <h3 className="text-lg font-semibold text-textPrimary mb-2">No Recommended Tests</h3>
              <p className="text-sm text-textSecondary">
                You do not have any mock tests assigned by mentors yet. Give your Student ID to your mentor to get assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-white border border-borderLight rounded-lg p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-bold text-textPrimary leading-snug">{rec.test_title}</h3>
                      <span className={`text-[10px] px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-wider shrink-0 ${getStatusColor(rec.status)}`}>
                        {rec.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-textSecondary space-y-1.5 mb-6 border-t border-borderLight pt-3">
                      <div><span className="font-medium text-textPrimary">Mentor:</span> {rec.mentor_name}</div>
                      <div><span className="font-medium text-textPrimary">Exam Type:</span> {rec.exam_type}</div>
                      <div><span className="font-medium text-textPrimary">Questions:</span> {rec.num_questions}</div>
                      <div><span className="font-medium text-textPrimary">Duration:</span> {Math.round(rec.time_limit_seconds / 60)} mins</div>
                      <div>
                        <span className="font-medium text-textPrimary">Assigned:</span> {new Date(rec.date_recommended).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-borderLight/60 mt-auto">
                    <span className="text-xs text-textSecondary font-medium">
                      {rec.status === 'completed' ? 'Completed & Scored' : rec.status === 'attempted' ? 'In Progress' : 'Not started yet'}
                    </span>
                    
                    {rec.status === 'completed' && rec.session_id ? (
                      <Link href={`/results/${rec.session_id}`}>
                        <Button size="sm" variant="outline">View Results</Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleStart(rec.id)}
                        disabled={startingRecId === rec.id}
                      >
                        {startingRecId === rec.id ? 'Loading...' : rec.status === 'attempted' ? 'Continue' : 'Start Test'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
