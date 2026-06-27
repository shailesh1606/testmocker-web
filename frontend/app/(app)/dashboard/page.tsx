import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';

// Note: Requires "use server" logic from fetchAPI in App Router
export default async function DashboardPage() {
  let sessions = [];
  try {
    sessions = await fetchAPI('/api/sessions?limit=10', { cache: 'no-store' });
  } catch (err) {
    // will be redirected to login by fetchAPI if 401
    console.error(err);
  }

  const bestScore = sessions.reduce((max: number, s: any) => Math.max(max, s.score || 0), 0);
  const avgScore = sessions.length ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / sessions.length) : 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar title="Dashboard" rightNode={<Link href="/test/new"><Button size="sm">Start New Test</Button></Link>} />
        
        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-textSecondary mt-1">Ready for your next test?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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

          <h2 className="text-lg font-semibold mb-4">Recent Tests</h2>
          <div className="bg-white border text-sm border-borderLight rounded shadow-sm overflow-hidden auto-rows-max">
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
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-textSecondary">No tests taken yet.</td></tr>
                ) : sessions.map((s: any, idx: number) => (
                  <tr key={s.id} className={`border-b border-borderLight ${idx % 2 !== 0 ? 'bg-pageBg/50' : ''} hover:bg-pageBg transition-colors`}>
                    <td className="px-6 py-4 font-medium uppercase">{s.exam_type}</td>
                    <td className="px-6 py-4">{s.score !== null ? s.score : '-'}</td>
                    <td className="px-6 py-4">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Link href={`/results/${s.id}`} className="text-primaryAccent font-medium hover:underline">View Results</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
