'use client';

import React, { useState } from 'react';
import { ZoomDashboard } from '../components/ZoomDashboard';
import {
  Video,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  FileText,
  Phone,
  Monitor,
  Headphones,
  Code2,
  Check,
  ChevronDown,
} from 'lucide-react';

type ProductTab =
  | 'meetings'
  | 'notes'
  | 'ai-mate'
  | 'canvas'
  | 'chat-phone'
  | 'ccaas'
  | 'rooms-workvivo'
  | 'developer';

export default function LobbyPage() {
  const [activeTab, setActiveTab] = useState<ProductTab>('meetings');
  const [showShowcase, setShowShowcase] = useState(false);

  const tabs: Array<{ id: ProductTab; label: string; icon: React.ElementType }> = [
    { id: 'meetings', label: 'Meetings & Webinars', icon: Video },
    { id: 'notes', label: 'AI Note Taker', icon: FileText },
    { id: 'ai-mate', label: 'ConversioMate AI', icon: Sparkles },
    { id: 'canvas', label: 'Canvas & Docs', icon: Monitor },
    { id: 'chat-phone', label: 'Team Chat & Phone', icon: MessageSquare },
    { id: 'ccaas', label: 'Contact Center', icon: Headphones },
    { id: 'rooms-workvivo', label: 'Rooms & Workvivo', icon: Phone },
    { id: 'developer', label: 'Developer Platform', icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 transition-colors flex flex-col">
      {/* Official Zoom UI/UX Dashboard */}
      <ZoomDashboard />

      {/* Toggle Button to Explore Full Platform Showcase */}
      <div className="py-6 px-4 flex justify-center bg-white/50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800/80">
        <button
          onClick={() => setShowShowcase((prev) => !prev)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#0E71EB]" />
          <span>{showShowcase ? 'Hide Platform Ecosystem' : 'Explore Conversio Platform Ecosystem & Features'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showShowcase ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Interactive Zoom 2026 Ecosystem Showcase */}
      {showShowcase && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 transition-colors animate-in fade-in duration-300">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                The Complete Conversio Collaboration Platform
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Inspired by the Zoom 2026 AI-first workplace: meetings, notes, intelligent assistant, team chat, and hybrid rooms.
              </p>
            </div>

            {/* Product Domain Tabs */}
            <div className="flex items-center justify-start md:justify-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                      isActive
                        ? 'bg-[#0E71EB] text-white shadow-blue-600/25'
                        : 'bg-slate-100 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Visual Showcase Card Container */}
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl transition">
              {/* 1. Video Meetings & Webinars */}
              {activeTab === 'meetings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0E71EB]/10 text-[#0E71EB] text-xs font-bold">
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Meetings & Webinars</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Crystal-clear video conferencing with intelligent active speaker spotlight
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Connect seamlessly with WebRTC audio & video, real-time screen sharing, interactive floating emoticons, gallery/speaker views, and composite audio local recording.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Active speaker detection with glowing audio stage auto-spotlight</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Live floating emoji reactions with zero server lag (👍 👏 ❤️ 😂 🎉 😮)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Local meeting recording with multi-track Web Audio synthesis (.webm)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#0F0F12] rounded-2xl p-4 border border-zinc-800 shadow-2xl aspect-video flex flex-col justify-between relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div className="bg-zinc-900 rounded-xl border-2 border-[#22C55E] ring-2 ring-[#22C55E]/60 relative flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0E71EB] to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                          S
                        </div>
                        <div className="absolute top-2 left-2 bg-[#22C55E] text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                          Speaking
                        </div>
                        <div className="absolute bottom-2 left-2 bg-zinc-950/80 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                          Sydney Ren (Host)
                        </div>
                      </div>
                      <div className="bg-zinc-900 rounded-xl border border-zinc-800 relative flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-lg">
                          M
                        </div>
                        <div className="absolute bottom-2 left-2 bg-zinc-950/80 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                          Marcus Vance
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-8 right-12 text-3xl animate-bounce">👏</div>
                    <div className="absolute top-12 left-16 text-3xl animate-pulse">🎉</div>
                  </div>
                </div>
              )}

              {/* 2. AI Note Taker */}
              {activeTab === 'notes' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>AI Note Taker (My Notes)</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Automated capture, real-time transcription, and action item extraction
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Conversio AI takes comprehensive meeting minutes, organizes speaker takeaways, generates executive summaries, and exports actionable tasks right into your tracker.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Patrick&apos;s Meeting Note • Today</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Live AI Synced</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">Executive Summary</p>
                      <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                        Evaluated Q4 growth targets and agreed to migrate all WebRTC signaling infrastructure to Redis 7 Pub/Sub clusters for zero-downtime horizontal scaling.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ConversioMate AI Assistant */}
              {activeTab === 'ai-mate' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ConversioMate AI Assistant</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Prompt-based generative intelligence across your workspace
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Ask ConversioMate anything during or after your meetings: &ldquo;What did Rob say about the budget?&rdquo; or &ldquo;Draft a slide outline for next Monday&apos;s sprint demo.&rdquo;
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-zinc-950 p-6 rounded-2xl border border-purple-500/30 shadow-xl space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>ConversioMate Prompt</span>
                    </div>
                    <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 text-xs text-zinc-300">
                      &ldquo;Synthesize action items from today&apos;s architecture call and assign deadlines.&rdquo;
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Canvas & Docs */}
              {activeTab === 'canvas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Productivity Suite & Canvas</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Integrated collaborative canvas and document workspace
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Create flowcharts, product diagrams, design sprints, and real-time multiplayer whiteboards with SVG freehand drawing, sticky notes, and instant exports.
                    </p>
                  </div>
                  <div className="bg-[#18181B] p-6 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-center aspect-video">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-zinc-800 rounded-xl text-center">
                        <span className="text-xs font-bold text-white">Ideation</span>
                      </div>
                      <span className="text-zinc-600">&rarr;</span>
                      <div className="p-4 bg-[#0E71EB] rounded-xl text-center text-white font-bold text-xs">
                        Architecture
                      </div>
                      <span className="text-zinc-600">&rarr;</span>
                      <div className="p-4 bg-[#22C55E] rounded-xl text-center text-slate-950 font-bold text-xs">
                        Production
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Team Chat & Phone */}
              {activeTab === 'chat-phone' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-[#0E71EB] text-xs font-bold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Unified Communications (UCaaS)</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Persistent team chat channels and cloud enterprise calling
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Keep work moving before, during, and after meetings with channels, 1-on-1 direct messages, file sharing, and virtual phone extensions.
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white border-b border-zinc-800 pb-2">
                      <span># engineering-general</span>
                    </div>
                    <div className="space-y-2 text-xs text-zinc-300">
                      <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                        <span className="font-bold text-[#0E71EB]">Alex: </span>
                        <span>WebRTC turn servers deployed across 3 edge locations.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Contact Center */}
              {activeTab === 'ccaas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Customer Experience & Contact Center</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Omni-channel routing and intelligent virtual customer agents
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Route customer inquiries effortlessly across voice, video, and live chat with instant CRM integration and sentiment analytics.
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-3 text-xs">
                    <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800 pb-2">
                      <span>Active Inquiries</span>
                      <span className="text-emerald-400 font-bold">99.8% CSAT</span>
                    </div>
                    <p className="text-zinc-300">AI Tier-1 Virtual Agent resolved 82% of queries automatically.</p>
                  </div>
                </div>
              )}

              {/* 7. Hybrid Rooms & Workvivo */}
              {activeTab === 'rooms-workvivo' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-[#E02828] text-xs font-bold">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Hardware & Hybrid Work Integration</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Conference room controllers and modern employee experience hub
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Transform any physical meeting room into a smart collaboration space with single-tap join, multi-screen display management, and social engagement.
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-center aspect-video text-xs text-zinc-400">
                    <span>Room Controller: Conference Room Alpha (Online)</span>
                  </div>
                </div>
              )}

              {/* 8. Developer Platform */}
              {activeTab === 'developer' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-bold">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Developer Platform & Ecosystem</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Custom video embedding via WebRTC SDK, REST APIs, and Webhooks
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Embed peer-to-peer video, breakout groups, in-meeting chat, and whiteboards directly into your React, iOS, Android, or desktop applications.
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto shadow-xl">
                    <p className="text-emerald-400">// Embed Conversio WebRTC Video</p>
                    <p>const manager = new WebRTCManager();</p>
                    <p>await manager.joinRoom(&apos;room-id&apos;, &#123; name: &apos;Dev&apos; &#125;);</p>
                  </div>
                </div>
              )}
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0E71EB]/10 text-[#0E71EB] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">End-to-End Cryptography</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Media tracks encrypted with DTLS-SRTP and DataChannels with Web Crypto AES-GCM. Passcodes hashed with bcrypt salt rounds.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">In-Meeting Local Recording</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Synthesize local mic and attendee streams via Web Audio API, recording directly to `.webm` with zero cloud upload exposure.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sub-100ms Latency</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Direct peer connection mesh with perfect negotiation glare prevention eliminates round-trip cloud transcoding latency.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enterprise Multi-Column Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-slate-500 dark:text-zinc-500 text-[11px] space-y-2 sm:space-y-0">
          <span>&copy; {new Date().getFullYear()} Conversio • Official Zoom UI/UX Video Conferencing & Collaboration.</span>
          <div className="flex items-center space-x-4">
            <span className="hover:text-[#0E71EB] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#0E71EB] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#0E71EB] cursor-pointer">Security Overview</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
