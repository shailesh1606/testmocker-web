import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: "bg-gray-100 text-gray-800 border bg-pageBg",
    success: "bg-success/10 text-success border-success/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    primary: "bg-primaryAccent/10 text-primaryAccent border-primaryAccent/20",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
}
