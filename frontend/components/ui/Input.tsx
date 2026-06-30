"use client";
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-[13px] font-medium text-textPrimary">{label}</label>}
      <input
        ref={ref}
        className={`px-3 py-2 bg-white border rounded text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-primaryAccent focus:ring-1 focus:ring-primaryAccent disabled:bg-pageBg transition-colors ${error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-borderLight'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
