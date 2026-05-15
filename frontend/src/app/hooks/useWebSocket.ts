import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  userId: number | null;
  onNewMessage?: (message: WebSocketMessage) => void;
  onTyping?: (userId: number, isTyping: boolean) => void;
  onUserOnline?: (userId: number, isOnline: boolean) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  sendTyping: (isTyping: boolean) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket({
  userId,
  onNewMessage,
  onTyping,
  onUserOnline,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!userId || typeof window === 'undefined') return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `ws://127.0.0.1:8000/ws/messages/${userId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsReconnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'new_message':
              onNewMessage?.(message.data);
              break;
            case 'typing':
              onTyping?.(message.data.user_id, message.data.is_typing);
              break;
            case 'user_online':
              onUserOnline?.(message.data.user_id, message.data.is_online);
              break;
            default:
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        if (autoReconnect) {
          setIsReconnecting(true);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }, [userId, autoReconnect, reconnectInterval, onNewMessage, onTyping, onUserOnline]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        data: { is_typing },
      }));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isReconnecting,
    sendTyping,
    disconnect,
    reconnect,
  };
}