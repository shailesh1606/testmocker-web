import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { MentorDashboard } from '@/components/dashboard/MentorDashboard';

export default async function DashboardPage() {
  let user = null;
  try {
    user = await fetchAPI('/api/auth/me', { cache: 'no-store' });
  } catch (err) {
    console.error("Failed to fetch current user profile", err);
    // If auth token is missing/expired, fetchAPI will redirect to /login
    return null;
  }

  if (user.role === 'MENTOR') {
    let assignments = [];
    try {
      assignments = await fetchAPI('/api/mentors/assignments', { cache: 'no-store' });
    } catch (err) {
      console.error("Failed to fetch mentor assignments", err);
    }

    return (
      <div className="flex flex-col md:flex-row min-h-screen w-full relative">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <TopBar title="Mentor Dashboard" />
          <MentorDashboard user={user} assignments={assignments} />
        </div>
      </div>
    );
  }

  // Student Flow (Default)
  let sessions = [];
  let recommendations = [];
  try {
    [sessions, recommendations] = await Promise.all([
      fetchAPI('/api/sessions?limit=1000', { cache: 'no-store' }),
      fetchAPI('/api/students/recommendations', { cache: 'no-store' })
    ]);
  } catch (err) {
    console.error("Failed to fetch student dashboard data", err);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar 
          title="Student Dashboard" 
          rightNode={
            <Link href="/test/new">
              <Button size="sm">Start New Test</Button>
            </Link>
          } 
        />
        <StudentDashboard 
          user={user} 
          sessions={sessions} 
          recommendations={recommendations} 
        />
      </div>
    </div>
  );
}
