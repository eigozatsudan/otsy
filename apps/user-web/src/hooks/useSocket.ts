import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('User-web useSocket useEffect triggered - user:', !!user, 'token:', !!token);
    
    if (!user || !token) {
      console.log('User-web: No user or token, skipping socket connection');
      return;
    }

    console.log('User-web: Creating socket connection to:', process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000');

    // Create socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000', {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('User-web: Cleaning up socket connection');
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, token]);

  return {
    socket,
    isConnected,
  };
};
