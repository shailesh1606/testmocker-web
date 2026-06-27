"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menu = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'My Tests', href: '/tests', icon: '📋' },
    { label: 'New Test', href: '/test/new', icon: '➕' }
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const desktopCls = "hidden md:flex flex-col w-[240px] bg-sidebarDark text-sidebarText min-h-screen border-r border-sidebarDark/50 pt-6";
  const mobileCls = "flex md:hidden fixed bottom-0 w-full bg-sidebarDark text-sidebarText border-t border-sidebarDark/50 z-40";

  return (
    <>
      <div className={desktopCls}>
        <div className="px-6 pb-6 text-xl font-bold text-white flex items-center gap-2">
          TestMocker <span className="w-2 h-2 rounded-full bg-primaryAccent"></span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 px-4">
          {menu.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`px-4 py-3 rounded flex items-center gap-3 font-medium text-sm transition-colors ${active ? 'bg-primaryAccent text-white' : 'hover:bg-sidebarDark/80 hover:text-white'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-sidebarText hover:text-white hover:bg-sidebarDark/80 rounded transition-colors text-left font-medium">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <div className={mobileCls}>
        {menu.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-medium ${active ? 'text-white' : 'text-sidebarText'}`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <button onClick={handleLogout} className="flex-1 py-3 flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs text-sidebarText font-medium">
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </>
  );
}
