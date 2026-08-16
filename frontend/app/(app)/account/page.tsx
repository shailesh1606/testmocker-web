"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // API Key States
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Statistics States
  const [stats, setStats] = useState({
    testsTaken: 0,
    testsCompleted: 0,
    averageScore: 0,
    testsCreated: 0,
    testsRecommended: 0,
    studentsAssigned: 0,
  });

  const fetchProfileAndStats = async () => {
    try {
      // 1. Fetch current profile metadata
      const profileRes = await fetch('/api/auth/me');
      if (!profileRes.ok) throw new Error("Failed to load profile details");
      const profileData = await profileRes.json();
      setProfile(profileData);
      setEditName(profileData.name || '');
      setEditEmail(profileData.email || '');
      setApiKey(profileData.openai_api_key_masked || '');

      // 2. Fetch statistics based on user role
      if (profileData.role === 'MENTOR') {
        const [assignmentsRes, testsRes] = await Promise.all([
          fetch('/api/mentors/assignments'),
          fetch('/api/mentors/tests'),
        ]);

        let recommendedCount = 0;
        let uniqueStudents = 0;
        let createdCount = 0;

        if (assignmentsRes.ok) {
          const assignments = await assignmentsRes.json();
          recommendedCount = assignments.length;
          uniqueStudents = Array.from(new Set(assignments.map((a: any) => a.student_id))).length;
        }

        if (testsRes.ok) {
          const tests = await testsRes.json();
          createdCount = tests.length;
        }

        setStats((prev) => ({
          ...prev,
          testsCreated: createdCount,
          testsRecommended: recommendedCount,
          studentsAssigned: uniqueStudents,
        }));
      } else {
        const sessionsRes = await fetch('/api/sessions?limit=1000');
        if (sessionsRes.ok) {
          const sessions = await sessionsRes.json();
          const completedSessions = sessions.filter((s: any) => s.status === 'completed' || s.status === 'submitted');
          const completedWithScore = sessions.filter((s: any) => s.status === 'completed');
          const avg = completedWithScore.length
            ? Math.round(completedWithScore.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / completedWithScore.length)
            : 0;

          setStats((prev) => ({
            ...prev,
            testsTaken: sessions.length,
            testsCompleted: completedSessions.length,
            averageScore: avg,
          }));
        }
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      addToast("Name and email are required", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");

      setProfile(data);
      await refreshUser();
      setIsEditing(false);
      addToast("Profile updated successfully", "success");
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      addToast("Please fill in a new password", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to change password");

      addToast("Password changed successfully", "success");
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingApiKey(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openai_api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update API key");

      setProfile(data);
      setApiKey(data.openai_api_key_masked || '');
      addToast("API Key updated successfully", "success");
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSavingApiKey(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-pageBg">
        <TopBar title="My Account" />

        <div className="p-6 md:p-10 flex-1 w-full max-w-5xl mx-auto space-y-8">
          {loading || !profile ? (
            <div className="p-10 text-center text-textSecondary">Loading account details...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-primaryAccent/10 text-primaryAccent rounded-full flex items-center justify-center font-bold text-2xl mb-4">
                    {getInitials(profile.name)}
                  </div>
                  <h2 className="text-xl font-bold text-textPrimary leading-tight mb-1">{profile.name}</h2>
                  <p className="text-xs text-textSecondary mb-4">{profile.email}</p>

                  <div className="w-full border-t border-borderLight/60 pt-4 text-left text-xs space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="font-medium text-textSecondary">Role:</span>
                      <span className="font-bold text-textPrimary uppercase tracking-wider">{profile.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-textSecondary">{profile.role === 'MENTOR' ? 'Mentor ID:' : 'Student ID:'}</span>
                      <span className="font-mono text-textPrimary text-[10px] bg-pageBg px-2 py-0.5 border border-borderLight rounded select-all">{profile.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-textSecondary">Joined:</span>
                      <span className="text-textPrimary">{new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                  </div>

                  {!isEditing ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="w-full space-y-3">
                      <Input
                        label="Full Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="text-xs py-1"
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        className="text-xs py-1"
                      />
                      <div className="flex gap-2 pt-1">
                        <Button type="submit" size="sm" disabled={savingProfile}>
                          {savingProfile ? "Saving..." : "Save"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Statistics Box */}
                <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm">
                  <h3 className="font-bold text-sm text-textPrimary mb-4 border-b border-borderLight/60 pb-2">Statistics Summary</h3>
                  {profile.role === 'MENTOR' ? (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-pageBg border border-borderLight rounded p-3">
                        <div className="text-xl font-extrabold text-primaryAccent">{stats.testsCreated}</div>
                        <div className="text-[10px] text-textSecondary mt-0.5 uppercase tracking-wider font-semibold">Created</div>
                      </div>
                      <div className="bg-pageBg border border-borderLight rounded p-3">
                        <div className="text-xl font-extrabold text-primaryAccent">{stats.testsRecommended}</div>
                        <div className="text-[10px] text-textSecondary mt-0.5 uppercase tracking-wider font-semibold">Assigned</div>
                      </div>
                      <div className="bg-pageBg border border-borderLight rounded p-3">
                        <div className="text-xl font-extrabold text-primaryAccent">{stats.studentsAssigned}</div>
                        <div className="text-[10px] text-textSecondary mt-0.5 uppercase tracking-wider font-semibold">Students</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-pageBg border border-borderLight rounded p-3">
                        <div className="text-xl font-extrabold text-primaryAccent">{stats.testsTaken}</div>
                        <div className="text-[10px] text-textSecondary mt-0.5 uppercase tracking-wider font-semibold">Taken</div>
                      </div>
                      <div className="bg-pageBg border border-borderLight rounded p-3">
                        <div className="text-xl font-extrabold text-primaryAccent">{stats.testsCompleted}</div>
                        <div className="text-[10px] text-textSecondary mt-0.5 uppercase tracking-wider font-semibold">Done</div>
                      </div>
                      <div className="bg-pageBg border border-borderLight rounded p-3">
                        <div className="text-xl font-extrabold text-primaryAccent">{stats.averageScore}</div>
                        <div className="text-[10px] text-textSecondary mt-0.5 uppercase tracking-wider font-semibold">Avg Score</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Settings Panels */}
              <div className="lg:col-span-2 space-y-6">

                {/* OpenAI API Key Section */}
                <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-textPrimary">API & Integrations</h3>
                    <p className="text-xs text-textSecondary mt-0.5">Configure your custom OpenAI credentials to run answer extraction and tutor hints.</p>
                  </div>

                  <form onSubmit={handleUpdateApiKey} className="space-y-4 pt-2 border-t border-borderLight/60">
                    <div className="relative">
                      <Input
                        label="OpenAI API Key"
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk-proj-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <p className="text-xs text-textSecondary mt-1">Provide your own OpenAI API key to bypass global mock rate limits. Leave blank to clear.</p>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-9 text-xs text-primaryAccent hover:underline select-none"
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </button>
                    </div>

                    <Button type="submit" size="sm" disabled={savingApiKey}>
                      {savingApiKey ? "Saving Key..." : "Save API Key"}
                    </Button>
                  </form>
                </div>

                {/* Account Security Section */}
                <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-textPrimary">Account Security</h3>
                    <p className="text-xs text-textSecondary mt-0.5">Change your account password and manage session settings.</p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-borderLight/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" size="sm" disabled={savingPassword}>
                      {savingPassword ? "Updating..." : "Change Password"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
