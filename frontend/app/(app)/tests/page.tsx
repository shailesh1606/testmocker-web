import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';

// Note: Requires "use server" logic from fetchAPI in App Router
export default async function TestsPage() {
  let sessions = [];
  try {
    sessions = await fetchAPI('/api/sessions?limit=100', { cache: 'no-store' });
  } catch (err) {
    console.error(err);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar title="My Tests" rightNode={<Link href="/test/new"><Button size="sm">Start New Test</Button></Link>} />
        
        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Past Tests</h1>
            <p className="text-textSecondary mt-1">Review your historical test performance and AI analysis.</p>
          </div>

          <div className="bg-white border text-sm border-borderLight rounded shadow-sm overflow-hidden auto-rows-max">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pageBg border-b border-borderLight text-textSecondary font-medium">
                  <th className="px-6 py-3">Exam Type</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-6 text-center text-textSecondary">No tests taken yet.</td></tr>
                ) : sessions.map((s: any, idx: number) => (
                  <tr key={s.id} className={`border-b border-borderLight ${idx % 2 !== 0 ? 'bg-pageBg/50' : ''} hover:bg-pageBg transition-colors`}>
                    <td className="px-6 py-4 font-medium uppercase">{s.exam_type}</td>
                    <td className="px-6 py-4 capitalize">{s.mode}</td>
                    <td className="px-6 py-4 font-mono">{s.score !== null ? s.score : '-'}</td>
                    <td className="px-6 py-4 text-textSecondary">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {s.status === 'completed' || s.score !== null ? (
                        <div className="flex gap-4">
                          <Link href={`/results/${s.id}`} className="text-primaryAccent font-medium hover:underline">Results</Link>
                          <Link href={`/analysis/${s.id}`} className="text-review font-medium hover:underline">Analysis</Link>
                        </div>
                      ) : (
                        <Link href={s.mode === 'learning' ? `/learn/${s.id}` : `/test/${s.id}`} className="text-warning font-medium hover:underline text-xs border border-warning/50 px-2 py-1 rounded">Continue Test</Link>
                      )}
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
