import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAdmin } = useAuth();
  const location = useLocation();

  // 🔥 detect chatbot or messages page
  const isChatbot = location.pathname === "/chatbot";
  const isMessages = location.pathname.endsWith("/messages");

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      <Toaster position="top-right" />

      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Navbar */}
        <Navbar />

        {/* 🔥 CONTENT */}
        <main className={`flex-1 ${isChatbot || isMessages ? 'overflow-hidden' : 'overflow-y-auto p-6'} bg-gray-50/50 dark:bg-transparent`}>

          {isChatbot || isMessages ? (
            // 🟣 chatbot or messages fullscreen
            <Outlet />
          ) : (
            // 🔵 normal pages
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          )}

        </main>

      </div>
    </div>
  );
}