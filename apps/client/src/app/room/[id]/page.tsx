'use client';

import React, { use } from 'react';
import { WebRTCProvider } from '../../../context/webrtc.context';
import { MeetingRoom } from '../../../components/MeetingRoom';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  return (
    <WebRTCProvider>
      <MeetingRoom roomId={unwrappedParams.id} />
    </WebRTCProvider>
  );
}
