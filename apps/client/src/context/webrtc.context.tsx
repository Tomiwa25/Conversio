'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { webrtcManager, WebRTCConnectionManager, WebRTCState } from '../services/webrtc.manager';

interface WebRTCContextType {
  manager: WebRTCConnectionManager;
  state: WebRTCState;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WebRTCState>(webrtcManager.getState());

  useEffect(() => {
    const unsubscribe = webrtcManager.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  return (
    <WebRTCContext.Provider value={{ manager: webrtcManager, state }}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

