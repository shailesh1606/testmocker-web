"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

interface MentorDashboardProps {
  user: { id: string; name: string; email: string };
  assignments: any[];
}

export function MentorDashboard({ user, assignments }: MentorDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);

  const { addToast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setFoundStudent(null);
    try {
      const res = await fetch(`/api/mentors/students/${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Student not found");
      setFoundStudent(data);
      addToast("Student found!", "success");
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-success/10 text-success border-success/20';
    if (status === 'attempted') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-textSecondary/10 text-textSecondary border-textSecondary/20';
  };

  return (
    <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, Mentor {user.name}!</h1>
        <p className="text-textSecondary mt-1">Manage mock tests and track your students' performance.</p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Student Lookup Tool */}
        <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm flex flex-col h-fit lg:col-span-2">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-textPrimary">
            <span>🔍</span> Student Lookup & Assignment
          </h2>
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Enter Student ID or Email"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={searching} className="self-end h-[42px] px-6">
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {foundStudent && (
            <div className="bg-pageBg border border-borderLight rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-bold text-textPrimary text-sm">{foundStudent.name}</h3>
                <p className="text-xs text-textSecondary">{foundStudent.email}</p>
                <p className="text-[10px] font-mono text-textSecondary bg-white border border-borderLight px-2 py-0.5 rounded inline-block">
                  ID: {foundStudent.id}
                </p>
              </div>
              <Link href={`/mentor/create-test?studentId=${foundStudent.id}`} className="shrink-0">
                <Button size="sm">Assign/Recommend Test</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h2 className="text-base font-bold mb-4 text-textPrimary">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/mentor/create-test" className="block">
                <Button variant="outline" fullWidth className="justify-start gap-2 py-3">
                  <span>➕</span> Create / Upload Mock Test
                </Button>
              </Link>
              <Link href="/mentor/assignments" className="block">
                <Button variant="ghost" fullWidth className="justify-start gap-2 py-3 border border-borderLight/40 bg-pageBg/20 hover:bg-pageBg">
                  <span>📋</span> View All Assignments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-textPrimary">Recent Assignments</h2>
          <Link href="/mentor/assignments" className="text-xs font-semibold text-primaryAccent hover:underline">
            View All
          </Link>
        </div>

        <div className="bg-white border text-sm border-borderLight rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pageBg border-b border-borderLight text-textSecondary font-medium">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Test Title</th>
                <th className="px-6 py-3">Exam Type</th>
                <th className="px-6 py-3">Assigned On</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textSecondary text-sm">
                    No mock tests assigned yet. Search a student to assign your first test.
                  </td>
                </tr>
              ) : (
                assignments.slice(0, 5).map((asg: any) => (
                  <tr key={asg.id} className="border-b border-borderLight last:border-0 hover:bg-pageBg/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-textPrimary">
                      {asg.student_name}
                      <span className="block text-[10px] text-textSecondary font-normal">{asg.student_email}</span>
                    </td>
                    <td className="px-6 py-4 text-textSecondary">{asg.test_title}</td>
                    <td className="px-6 py-4">{asg.exam_type}</td>
                    <td className="px-6 py-4 text-textSecondary">
                      {new Date(asg.date_recommended).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2.5 py-1 border rounded-full font-bold uppercase tracking-wider ${getStatusColor(asg.status)}`}>
                        {asg.status}
                      </span>
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
