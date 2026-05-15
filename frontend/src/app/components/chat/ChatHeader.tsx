import { motion } from 'framer-motion';
import { MessageSquare, Settings, Wifi, WifiOff } from 'lucide-react';

interface ChatHeaderProps {
  onlineCount: number;
}

export function ChatHeader({ onlineCount }: ChatHeaderProps) {
  return (
    <div className="px-6 py-4 bg-[#0B1121]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20">
          <MessageSquare className="w-5 h-5 text-gray-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight text-gray-900 dark:text-white">
            Messaging <span className="text-violet-400">Pro</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              {onlineCount} en ligne
            </span>
          </div>
        </div>
      </div>
      <button className="p-2 text-slate-500 hover:text-gray-900 dark:text-white hover:bg-white dark:bg-slate-900/5 rounded-xl transition-colors">
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}