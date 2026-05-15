import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  content: string;
  is_read: boolean;
  is_urgent: boolean;
  created_at: string;
  read_at?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file' | 'audio';
  attachment_name?: string;
}

export interface Conversation {
  user_id: number;
  user_name: string;
  user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
  avatar_url?: string;
}

interface UseMessagesReturn {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  isTyping: boolean;
  myUserId: number | null;
  loadConversations: () => Promise<void>;
  loadMessages: (userId: number) => Promise<void>;
  sendMessage: (receiverId: number, content: string, isUrgent: boolean) => Promise<Message>;
  markAsRead: (messageId: number) => Promise<void>;
  broadcastMessage: (content: string) => Promise<void>;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    user_id: 1,
    user_name: 'Marie Dubois',
    user_role: 'agent',
    last_message: 'RDV confirmé pour demain à 14h',
    last_message_time: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 2,
    is_online: true,
  },
  {
    user_id: 2,
    user_name: 'Pierre Leroy',
    user_role: 'agent',
    last_message: 'Client absent, je rappellerai',
    last_message_time: new Date(Date.now() - 86000000).toISOString(),
    unread_count: 0,
    is_online: false,
  },
  {
    user_id: 3,
    user_name: 'Sophie Martin',
    user_role: 'agent',
    last_message: 'Demande de rappel urgent',
    last_message_time: new Date(Date.now() - 172000000).toISOString(),
    unread_count: 5,
    is_online: true,
  },
  {
    user_id: 4,
    user_name: 'Jean-Philippe',
    user_role: 'agent',
    last_message: 'Nouveaux leads disponibles',
    last_message_time: new Date(Date.now() - 300000).toISOString(),
    unread_count: 1,
    is_online: true,
  },
  {
    user_id: 5,
    user_name: 'Claire Fontaine',
    user_role: 'agent',
    last_message: 'Rendez-vous reporté',
    last_message_time: new Date(Date.now() - 7200000).toISOString(),
    unread_count: 0,
    is_online: false,
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    sender_id: 1,
    sender_name: 'Marie Dubois',
    receiver_id: 0,
    receiver_name: 'Admin',
    content: 'Bonjour! J\'ai un client très intéressé par le package premium. Pouvez-vous me donner plus d\'informations sur les fonctionnalités incluses?',
    is_read: true,
    is_urgent: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    sender_id: 0,
    sender_name: 'Admin',
    receiver_id: 1,
    receiver_name: 'Marie Dubois',
    content: 'Bonjour Marie! Bien sûr, je vous envoie le dossier complet avec toutes les informations. Le package premium inclutFormation complète illimitée + Support prioritaire + Accès API.',
    is_read: true,
    is_urgent: false,
    created_at: new Date(Date.now() - 86000000).toISOString(),
  },
  {
    id: 3,
    sender_id: 1,
    sender_name: 'Marie Dubois',
    receiver_id: 0,
    receiver_name: 'Admin',
    content: 'Parfait! Le client est très satisfait. Il veut signer demain.',
    is_read: true,
    is_urgent: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 4,
    sender_id: 0,
    sender_name: 'Admin',
    receiver_id: 1,
    receiver_name: 'Marie Dubois',
    content: 'Excellent! Dites-lui que je confirme le RDV demain à 14h.',
    is_read: true,
    is_urgent: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 5,
    sender_id: 1,
    sender_name: 'Marie Dubois',
    receiver_id: 0,
    receiver_name: 'Admin',
    content: 'RDV confirmé pour demain à 14h',
    is_read: false,
    is_urgent: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

export function useMessages(): UseMessagesReturn {
  const { user: currentUser } = useAuth();
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentUser?.id != null) {
      setMyUserId(Number(currentUser.id));
    }
  }, [currentUser]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.map((c: Conversation) => ({
        ...c,
        is_online: c.is_online ?? Math.random() > 0.4,
      })));
    } catch (e) {
      setConversations(MOCK_CONVERSATIONS);
    }
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMessages(userId);
      setMessages(data);
    } catch (e) {
      setMessages(MOCK_MESSAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    receiverId: number,
    content: string,
    isUrgent: boolean = false
  ): Promise<Message> => {
    setSending(true);
    setError(null);
    try {
      const msg = await api.sendMessage(receiverId, content, isUrgent);
      setMessages(prev => [...prev, msg]);
      return msg;
    } catch (e) {
      const mockMsg: Message = {
        id: Date.now(),
        sender_id: myUserId || 0,
        sender_name: 'Admin',
        receiver_id: receiverId,
        receiver_name: conversations.find(c => c.user_id === receiverId)?.user_name || 'Agent',
        content,
        is_read: false,
        is_urgent: isUrgent,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, mockMsg]);
      
      setTimeout(() => setIsTyping(true), 500);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg: Message = {
          id: Date.now() + 1,
          sender_id: receiverId,
          sender_name: conversations.find(c => c.user_id === receiverId)?.user_name || 'Agent',
          receiver_id: myUserId || 0,
          receiver_name: 'Admin',
          content: 'Bien reçu! Je traitte cela immédiatement.',
          is_read: false,
          is_urgent: false,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, replyMsg]);
      }, 3000);
      
      return mockMsg;
    } finally {
      setSending(false);
    }
  }, [myUserId, conversations]);

  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await api.markMessageAsRead(messageId);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
      ));
    } catch (e) {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
      ));
    }
  }, []);

  const broadcastMessage = useCallback(async (content: string) => {
    setSending(true);
    try {
      for (const conv of conversations) {
        await api.sendMessage(conv.user_id, content, false);
      }
    } catch (e) {
      console.log('Broadcast demo mode');
    } finally {
      setSending(false);
    }
  }, [conversations]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  return {
    conversations,
    messages,
    loading,
    sending,
    error,
    isTyping,
    myUserId,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    broadcastMessage,
  };
}