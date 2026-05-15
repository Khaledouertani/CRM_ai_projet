import { motion } from 'framer-motion';

export function ChatSkeleton() {
  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar skeleton */}
      <div className="w-80 flex-shrink-0 bg-[#0B1121]/60 border-r border-white/5 p-4 space-y-3">
        <div className="h-10 bg-white dark:bg-slate-900/[0.03] rounded-xl animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900/[0.03] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white dark:bg-slate-900/[0.03] rounded-md w-2/3 animate-pulse" />
              <div className="h-2.5 bg-white dark:bg-slate-900/[0.02] rounded-md w-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {/* Main skeleton */}
      <div className="flex-1 bg-[#0B1121]/30 flex flex-col items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-slate-900/[0.03] animate-pulse" />
          <div className="h-4 bg-white dark:bg-slate-900/[0.03] rounded-md w-48 animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}