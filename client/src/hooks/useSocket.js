import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDataStore } from '../store/useStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const { updateFlights, updateShips, setConnected, setHistory } = useDataStore();

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    socket.on('flights:update', (data) => {
      if (Array.isArray(data)) updateFlights(data);
    });

    socket.on('ships:update', (data) => {
      if (Array.isArray(data)) updateShips(data);
    });

    socket.on('history:update', (data) => {
      if (Array.isArray(data)) setHistory(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
