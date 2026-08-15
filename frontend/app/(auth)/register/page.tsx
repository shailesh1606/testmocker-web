"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      
      addToast("Registration successful!", 'success');
      await login();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pageBg p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-borderLight">
        <h1 className="text-2xl font-bold text-center mb-6">Create an account</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <Input 
            label="Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-textPrimary">I am a</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-borderLight rounded text-sm bg-white focus:outline-none focus:border-primaryAccent focus:ring-1 focus:ring-primaryAccent"
            >
              <option value="STUDENT">Student</option>
              <option value="MENTOR">Mentor</option>
            </select>
          </div>
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-textSecondary">
          Already have an account? <Link href="/login" className="text-primaryAccent font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
