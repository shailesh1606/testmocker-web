"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE = process.env.API_URL || "http://backend:8000";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = cookies().get('auth_token')?.value;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!options.body || !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  } else if (options.body instanceof FormData) {
    // Let browser set content-type with boundary for multipart
    headers.delete('Content-Type'); 
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    redirect('/login');
  }

  if (!res.ok) {
    try {
      const errData = await res.json();
      throw new Error(errData.detail || `Error: ${res.status}`);
    } catch (e: any) {
      throw new Error(e.message || "An unexpected error occurred");
    }
  }

  return res.json();
}
