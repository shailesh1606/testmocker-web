"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface StudentDashboardProps {
  user: { id: string; name: string; email: string };
  sessions: any[];
  recommendations: any[];
}

export function StudentDashboard({ user, sessions, recommendations }: StudentDashboardProps) {
  const [startingRecId, setStartingRecId] = useState<string | null>(null);
  const router = useRouter();

  const bestScore = sessions.reduce((max: number, s: any) => Math.max(max, s.score || 0), 0);
  const avgScore = sessions.length ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / sessions.length) : 0;

  const handleStart = async (recId: string) => {
    setStartingRecId(recId);
    try {
      const res = await fetch(`/api/students/recommendations/${recId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to start test");
      const data = await res.json();
      router.push(`/test/${data.session_id}`);
    } catch (err) {
      console.error(err);
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
    <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
      {/* Welcome & Student ID Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-textSecondary mt-1">Ready for your next mock test?</p>
        </div>
        <div className="bg-white border border-borderLight px-4 py-2.5 rounded shadow-sm flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-textSecondary">Student ID:</span>
          <span className="font-mono text-xs bg-pageBg border border-borderLight px-2.5 py-1 rounded select-all cursor-pointer hover:bg-borderLight/30" title="Click to select and copy ID">
            {user.id}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded shadow-sm border border-borderLight flex flex-col">
          <span className="text-sm font-medium text-textSecondary mb-2">Total Tests Taken</span>
          <span className="text-3xl font-bold text-primaryAccent">{sessions.length}</span>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-borderLight flex flex-col">
          <span className="text-sm font-medium text-textSecondary mb-2">Average Score</span>
          <span className="text-3xl font-bold text-warning">{avgScore}</span>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-borderLight flex flex-col">
          <span className="text-sm font-medium text-textSecondary mb-2">Best Score</span>
          <span className="text-3xl font-bold text-success">{bestScore}</span>
        </div>
      </div>

      {/* Mentor Recommended Tests Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>👨‍🏫</span> Mentor Recommended Tests
        </h2>
        
        {recommendations.length === 0 ? (
          <div className="bg-white border border-borderLight rounded-lg p-8 text-center text-textSecondary text-sm shadow-sm">
            No mock tests recommended by mentors yet. Give your Student ID to your mentor to get assignments.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="bg-white p-6 rounded-lg border border-borderLight shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-base text-textPrimary leading-tight">{rec.test_title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider shrink-0 ${getStatusColor(rec.status)}`}>
                      {rec.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-textSecondary space-y-1 mb-4">
                    <div><span className="font-medium text-textPrimary">Exam Type:</span> {rec.exam_type}</div>
                    <div><span className="font-medium text-textPrimary">Questions:</span> {rec.num_questions}</div>
                    <div><span className="font-medium text-textPrimary">Time Limit:</span> {Math.round(rec.time_limit_seconds / 60)} mins</div>
                    <div className="pt-2 border-t border-borderLight/60 mt-2">
                      <span className="font-semibold text-primaryAccent">Recommended by:</span> {rec.mentor_name} ({rec.mentor_email})
                    </div>
                    <div>
                      <span className="font-medium">Recommended on:</span> {new Date(rec.date_recommended).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-borderLight/60 flex items-center justify-between">
                  <span className="text-xs text-textSecondary">
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

      {/* Recent Tests Table */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent General Tests</h2>
        <div className="bg-white border text-sm border-borderLight rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pageBg border-b border-borderLight text-textSecondary font-medium">
                <th className="px-6 py-3">Exam Type</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-textSecondary text-sm">
                    No mock tests taken yet. Click "Start New Test" to begin.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="border-b border-borderLight last:border-0 hover:bg-pageBg/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      {session.exam_type}
                      <span className={`text-[10px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider ${session.mode === 'learning' ? 'bg-review/10 text-review border-review/20' : 'bg-primaryAccent/10 text-primaryAccent border-primaryAccent/20'}`}>
                        {session.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {session.status === 'completed' ? (
                        <span className="text-success">{session.score}</span>
                      ) : (
                        <span className="text-warning italic text-xs uppercase tracking-wider font-bold">{session.status.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-textSecondary">
                      {new Date(session.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'completed' ? (
                        <Link href={`/results/${session.id}`} className="text-primaryAccent font-medium hover:underline">
                          View Analysis
                        </Link>
                      ) : session.status === 'submitted' ? (
                        <Link href={`/test/${session.id}/answer-key`} className="text-warning font-medium hover:underline">
                          Enter Answer Key
                        </Link>
                      ) : (
                        <Link href={session.mode === 'learning' ? `/learn/${session.id}` : `/test/${session.id}`} className="text-primaryAccent font-medium hover:underline">
                          Continue
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
