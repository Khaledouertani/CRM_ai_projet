import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Image, File, Clock, AlertCircle } from 'lucide-react';
import type { Message } from '../../types/chat';
import { formatDistanceToNow } from '../../utils/date';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
    >
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[75%]`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-xs flex-shrink-0">
            {message.sender_name?.[0] || '?'}
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`
            relative px-4 py-2.5 rounded-2xl backdrop-blur-xl
            ${isOwn 
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-md' 
              : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-bl-md'
            }
            ${message.is_urgent ? 'ring-2 ring-red-500/50' : ''}
          `}
        >
          {/* Urgent Badge */}
          {Boolean(message.is_urgent) && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-3 h-3 text-gray-900 dark:text-white" />
            </div>
          )}

          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Attachments */}
          {(message as any).attachments && (message as any).attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {(message as any).attachments.map((att: any) => (
                <AttachmentPreview key={att.id} attachment={att} isOwn={isOwn} />
              ))}
            </div>
          )}

          {/* Meta */}
          <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-500'}`}>
              {formatDistanceToNow(new Date(message.created_at || new Date()))}
            </span>
            {isOwn && (
              message.is_read ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white/60" />
              )
            )}
          </div>
        </div>

        {/* Spacer for own messages to show avatar area */}
        {isOwn && showAvatar && <div className="w-8" />}
      </div>
    </motion.div>
  );
}

interface AttachmentPreviewProps {
  attachment: any;
  isOwn: boolean;
}

function AttachmentPreview({ attachment, isOwn }: AttachmentPreviewProps) {
  if (attachment.type === 'image') {
    return (
      <div className="relative rounded-lg overflow-hidden">
        <img 
          src={attachment.url} 
          alt={attachment.name}
          className="max-w-full h-auto rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg
      ${isOwn ? 'bg-white dark:bg-slate-900/10' : 'bg-slate-700/50'}
    `}>
      <File className={`w-4 h-4 ${isOwn ? 'text-white/70' : 'text-slate-400'}`} />
      <span className={`text-xs truncate ${isOwn ? 'text-white/90' : 'text-slate-300'}`}>
        {attachment.name}
      </span>
    </div>
  );
}
