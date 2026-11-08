'use client';

import React, { useState } from 'react';
import { useWebRTC } from '../context/webrtc.context';
import { BreakoutRoom } from '@conversio/shared';
import { Users, X, Send, Clock, DoorOpen, Plus, Sparkles } from 'lucide-react';

interface BreakoutRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BreakoutRoomsModal: React.FC<BreakoutRoomsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state, manager } = useWebRTC();
  const [roomCount, setRoomCount] = useState<number>(2);
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [createdRooms, setCreatedRooms] = useState<BreakoutRoom[]>([]);

  if (!isOpen) return null;

  const isHost = state.currentUser?.role === 'host';
  const otherParticipants = state.participants.filter(
    (p) => p.id !== state.currentUser?.id
  );

  // Generate automatic room assignment
  const handleGenerateRooms = () => {
    const rooms: BreakoutRoom[] = [];
    for (let i = 1; i <= roomCount; i++) {
      rooms.push({
        id: `room-${i}-${Date.now().toString().slice(-4)}`,
        name: `Small Group ${i}`,
        participantIds: [],
      });
    }

    // Distribute other participants evenly
    otherParticipants.forEach((p, index) => {
      const roomIndex = index % roomCount;
      rooms[roomIndex].participantIds.push(p.id);
    });

    setCreatedRooms(rooms);
  };

  const handleOpenRooms = () => {
    const roomsToOpen = createdRooms.length > 0 ? createdRooms : [];
    if (roomsToOpen.length === 0) {
      // Auto-create default 2 rooms if host clicks Open immediately
      const r1: BreakoutRoom = {
        id: `room-1-${Date.now()}`,
        name: 'Small Group 1',
        participantIds: otherParticipants.slice(0, Math.ceil(otherParticipants.length / 2)).map((p) => p.id),
      };
      const r2: BreakoutRoom = {
        id: `room-2-${Date.now()}`,
        name: 'Small Group 2',
        participantIds: otherParticipants.slice(Math.ceil(otherParticipants.length / 2)).map((p) => p.id),
      };
      manager.createBreakoutRooms([r1, r2]);
    } else {
      manager.createBreakoutRooms(roomsToOpen);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    manager.broadcastBreakoutAnnouncement(broadcastMessage.trim());
    setBroadcastMessage('');
  };

  const handleCloseRooms = () => {
    manager.closeBreakoutRooms(60);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Small Group Discussions</h2>
              <p className="text-xs text-slate-400">
                Split participants into smaller rooms for interactive discussions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {!state.isBreakoutOpen ? (
            /* Creation & Assignment View */
            <div className="space-y-4">
              {isHost ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Number of Groups
                    </label>
                    <div className="flex items-center space-x-2">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setRoomCount(count);
                            setCreatedRooms([]);
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                            roomCount === count
                              ? 'bg-blue-600 text-white border-blue-500 shadow'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {count} Groups
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">Automatic Assignment</p>
                      <p className="text-[11px] text-slate-400">
                        {otherParticipants.length} attendee
                        {otherParticipants.length === 1 ? '' : 's'} will be evenly distributed
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateRooms}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-medium transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preview Distribution</span>
                    </button>
                  </div>

                  {/* Room Previews */}
                  {createdRooms.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-medium text-slate-300">Room Assignments:</p>
                      <div className="space-y-2">
                        {createdRooms.map((room) => (
                          <div
                            key={room.id}
                            className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col space-y-1.5"
                          >
                            <span className="text-xs font-semibold text-white">{room.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {room.participantIds.length > 0 ? (
                                room.participantIds.map((pId) => {
                                  const p = state.participants.find((item) => item.id === pId);
                                  return (
                                    <span
                                      key={pId}
                                      className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] border border-slate-700"
                                    >
                                      {p?.name || 'Attendee'}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">No attendees assigned</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  The host has not opened any small group discussions yet.
                </div>
              )}
            </div>
          ) : (
            /* Active Breakout Rooms View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-950/40 border border-blue-900/60 p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-medium text-blue-200">
                    Groups are actively in session
                  </span>
                </div>
                {state.currentBreakoutRoomId && (
                  <button
                    onClick={() => manager.joinBreakoutRoom(null)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                  >
                    Main Meeting
                  </button>
                )}
              </div>

              {/* Active Room List */}
              <div className="space-y-2">
                {state.breakoutRooms.map((room) => {
                  const isCurrent = state.currentBreakoutRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-blue-900/30 border-blue-500/80'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-semibold text-white">{room.name}</h4>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500 text-white">
                              You are here
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {room.participantIds.length} attendee{room.participantIds.length === 1 ? '' : 's'} assigned
                        </p>
                      </div>

                      <button
                        onClick={() => manager.joinBreakoutRoom(isCurrent ? null : room.id)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isCurrent
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'Leave' : 'Join'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Host Broadcast Announcement Input */}
              {isHost && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Broadcast Message to All Groups
                  </label>
                  <form onSubmit={handleBroadcast} className="flex space-x-2">
                    <input
                      type="text"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g. Please wrap up in 2 minutes..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!broadcastMessage.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center space-x-1 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Close
          </button>

          {isHost && (
            <>
              {!state.isBreakoutOpen ? (
                <button
                  onClick={handleOpenRooms}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition flex items-center space-x-1.5"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Start All Groups</span>
                </button>
              ) : (
                <button
                  onClick={handleCloseRooms}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition flex items-center space-x-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>End Groups (60s)</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
