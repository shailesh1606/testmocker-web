"use client";

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', size = 'md', fullWidth, className = '', children, ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primaryAccent text-white hover:bg-accentHover focus:ring-primaryAccent border border-transparent",
    secondary: "bg-sidebarDark text-white hover:opacity-90 focus:ring-sidebarDark border border-transparent",
    outline: "bg-transparent text-primaryAccent border border-primaryAccent hover:bg-primaryAccent/10 focus:ring-primaryAccent",
    ghost: "bg-transparent text-textSecondary hover:text-textPrimary hover:bg-borderLight/30 border border-transparent",
    danger: "bg-danger text-white hover:opacity-90 focus:ring-danger border border-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const fw = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fw} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
