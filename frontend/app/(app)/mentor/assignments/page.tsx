"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import Link from 'next/link';

export default function MentorAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await fetch('/api/mentors/assignments');
        if (!res.ok) throw new Error("Failed to load assignments");
        const data = await res.json();
        setAssignments(data);
      } catch (err: any) {
        addToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, [addToast]);

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-success/10 text-success border-success/20';
    if (status === 'attempted') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-textSecondary/10 text-textSecondary border-textSecondary/20';
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopBar
          title="Assigned Tests Summary"
          rightNode={
            <Link href="/mentor/create-test">
              <Button size="sm">Create & Assign Test</Button>
            </Link>
          }
        />

        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto animate-fade-in">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-textPrimary">Track Student Progress</h1>
            <p className="text-xs text-textSecondary mt-1">View status of tests assigned to students by you.</p>
          </div>

          <div className="bg-white border text-sm border-borderLight rounded shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pageBg border-b border-borderLight text-textSecondary font-medium">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Student ID</th>
                  <th className="px-6 py-3">Test Title</th>
                  <th className="px-6 py-3">Exam Type</th>
                  <th className="px-6 py-3">Recommended On</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-textSecondary">
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-textSecondary">
                      No assignments found. Click "Create & Assign Test" to assign your first mock exam.
                    </td>
                  </tr>
                ) : (
                  assignments.map((asg) => (
                    <tr key={asg.id} className="border-b border-borderLight last:border-0 hover:bg-pageBg/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-textPrimary">
                        {asg.student_name}
                        <span className="block text-xs text-textSecondary font-normal">{asg.student_email}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-textSecondary">{asg.student_id}</td>
                      <td className="px-6 py-4 text-textSecondary font-medium">{asg.test_title}</td>
                      <td className="px-6 py-4">{asg.exam_type}</td>
                      <td className="px-6 py-4 text-textSecondary">
                        {new Date(asg.date_recommended).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 border rounded-full font-bold uppercase tracking-wider ${getStatusColor(asg.status)}`}>
                          {asg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {asg.status === 'completed' && asg.session_id ? (
                          <Link href={`/results/${asg.session_id}`} className="text-primaryAccent hover:underline font-bold text-xs">
                            View Results
                          </Link>
                        ) : (
                          <span className="text-textSecondary text-xs">—</span>
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
    </div>
  );
}
