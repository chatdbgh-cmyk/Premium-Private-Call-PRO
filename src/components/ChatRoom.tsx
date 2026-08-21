import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ArrowLeft,
  XCircle,
  Gem,
  CheckCheck,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Clock,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  Volume2,
  VolumeX,
  Paperclip,
  Image as ImageIcon,
  Play,
  Pause,
  Maximize2,
  X,
  Smile,
  Info,
  Check,
  MapPin,
  Compass,
} from 'lucide-react';
import { ChatMessage, Developer } from '../types';
import { sounds } from '../utils/sound';
import { realtimeBus } from '../utils/realtime';
import { webrtcVoice } from '../utils/webrtc';
import { sanitizeInput, securityFirewall } from '../utils/security';
import { locationService } from '../utils/locationService';
import { voiceRecorder } from '../utils/voiceRecorder';
import { LiveLocationModal } from './LiveLocationModal';

interface ChatRoomProps {
  activeSeller: Developer;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    developerId: number,
    attachment?: ChatMessage['attachment']
  ) => void;
  onSessionEnd: () => void;
  onBackToList: () => void;
  onHireDeveloper: (developer: Developer) => void;
  isAdmin?: boolean;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  activeSeller,
  messages,
  onSendMessage,
  onSessionEnd,
  onBackToList,
  onHireDeveloper,
  isAdmin = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Voice Call state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [liveAudioLevels, setLiveAudioLevels] = useState<number[]>([40, 70, 30, 90, 50, 80, 60, 100, 45, 85, 35, 75]);

  // Voice Note Recording state (Audio Only, No Location)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveRecordLevels, setLiveRecordLevels] = useState<number[]>([25, 45, 60, 35, 70, 50, 40, 65]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordWaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Note Playing state & Progress
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);

  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Live Location Tracker modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Background Live GPS Location capture on chat mount
  useEffect(() => {
    locationService.requestLiveLocation().catch(() => {});
    locationService.startContinuousWatching();
  }, []);

  // Listen to Audio Playback changes
  useEffect(() => {
    const unsubscribe = voiceRecorder.onPlaybackChange((activeId, progress) => {
      setPlayingVoiceId(activeId);
      setPlaybackProgress(progress);
    });
    return () => {
      unsubscribe();
      voiceRecorder.stopPlayback();
    };
  }, []);

  // Listen to WebRTC Voice call state
  useEffect(() => {
    const unsubscribe = webrtcVoice.onCallStateChange((session) => {
      if (session.targetDeveloperId === activeSeller.id || session.callerId) {
        if (session.status === 'connected') {
          setCallStatus('connected');
        } else if (session.status === 'calling' || session.status === 'ringing') {
          setCallStatus('connecting');
        } else if (session.status === 'ended' || session.status === 'rejected') {
          setCallStatus('ended');
          setTimeout(() => setIsCallModalOpen(false), 800);
        }
        setIsMuted(session.isMuted);
        setIsSpeakerOn(session.isSpeakerOn);
      }
    });
    return () => unsubscribe();
  }, [activeSeller.id]);

  // Live Audio Analyzer equalizer update
  useEffect(() => {
    let animId: NodeJS.Timeout | null = null;
    if (isCallModalOpen && callStatus === 'connected') {
      animId = setInterval(() => {
        setLiveAudioLevels(webrtcVoice.getLiveAudioLevel());
      }, 100);
    }
    return () => {
      if (animId) clearInterval(animId);
    };
  }, [isCallModalOpen, callStatus]);

  // Filter messages for this specific active seller
  const sellerMessages = messages.filter(
    (msg) => msg.developerId === activeSeller.id
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sellerMessages, isTyping]);

  // Handle Call Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCallModalOpen && callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallModalOpen, callStatus]);

  // Listen to remote typing events via realtimeBus
  useEffect(() => {
    const unsubscribe = realtimeBus.subscribe((event) => {
      if (
        event.type === 'TYPING_START' &&
        event.data?.developerId === activeSeller.id
      ) {
        setIsTyping(true);
      } else if (
        event.type === 'TYPING_STOP' &&
        event.data?.developerId === activeSeller.id
      ) {
        setIsTyping(false);
      }
    });
    return () => unsubscribe();
  }, [activeSeller.id]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Voice Call (WebRTC Peer Connection & Audio Mesh & GPS Location Sync)
  const handleStartCall = async () => {
    sounds.playCallRing();
    setIsCallModalOpen(true);
    setCallStatus('connecting');
    setCallDuration(0);

    try {
      await webrtcVoice.initiateCall({
        targetDeveloperId: activeSeller.id,
        targetDeveloperName: activeSeller.name,
        callerId: 'user_active',
        callerName: 'কাস্টমার',
      });
      sounds.playCallConnected();
    } catch (e) {
      console.warn('WebRTC start error:', e);
      setCallStatus('connected');
    }
  };

  // End Voice Call
  const handleEndCall = () => {
    sounds.playCancel();
    setCallStatus('ended');
    webrtcVoice.endSession();
    const finalDurationText = formatDuration(callDuration);

    setTimeout(() => {
      setIsCallModalOpen(false);
      // Log call into chat
      if (callDuration > 0) {
        onSendMessage(
          `📞 ভয়েস অডিও সেশন সম্পন্ন হয়েছে (স্থায়িত্ব: ${finalDurationText} মিনিট)`,
          activeSeller.id
        );
      }
    }, 600);
  };

  // Handle Send text message with Security Sanitization and Rate Limiting
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    // Rate Limiting Check
    const rateCheck = securityFirewall.canSendMessage();
    if (!rateCheck.allowed) {
      alert(`স্প্যাম প্রতিরোধ: অনুগ্রহ করে ${rateCheck.waitSeconds || 5} সেকেন্ড অপেক্ষা করুন।`);
      return;
    }

    const cleanText = sanitizeInput(raw);
    sounds.playSend();
    onSendMessage(cleanText, activeSeller.id);
    setInputText('');

    // Simulate host typing & real-time auto response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      sounds.playReceive();
    }, 1200);
  };

  // Handle Voice Recording Start (Microphone ONLY)
  const handleStartVoiceRecording = async () => {
    sounds.playVoiceRecord();
    setIsRecordingVoice(true);
    setRecordSeconds(0);

    const started = await voiceRecorder.startRecording();
    if (!started) {
      console.warn('Microphone fallback active');
    }

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);

    if (recordWaveTimerRef.current) clearInterval(recordWaveTimerRef.current);
    recordWaveTimerRef.current = setInterval(() => {
      setLiveRecordLevels(voiceRecorder.getRecordingLiveLevels());
    }, 120);
  };

  // Handle Voice Recording Cancel
  const handleCancelVoiceRecording = () => {
    sounds.playCancel();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recordWaveTimerRef.current) clearInterval(recordWaveTimerRef.current);
    voiceRecorder.cancelRecording();
    setIsRecordingVoice(false);
    setRecordSeconds(0);
  };

  // Handle Voice Recording Send
  const handleSendVoiceRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recordWaveTimerRef.current) clearInterval(recordWaveTimerRef.current);
    sounds.playSend();

    const recorded = await voiceRecorder.stopRecording();
    const duration = recorded.duration || recordSeconds || 1;
    setIsRecordingVoice(false);
    setRecordSeconds(0);

    onSendMessage(
      '🎙️ ভয়েস বার্তা',
      activeSeller.id,
      {
        type: 'voice',
        url: recorded.dataUrl,
        duration,
        name: `ভয়েস নোট (${duration}s)`,
      }
    );

    // Host response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      sounds.playReceive();
    }, 1500);
  };

  // Handle Image Attachment
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      if (imgDataUrl) {
        sounds.playSend();
        onSendMessage(
          '🖼️ ছবি / স্ক্রিনশট শেয়ার করা হয়েছে',
          activeSeller.id,
          {
            type: 'image',
            url: imgDataUrl,
            name: file.name,
          }
        );
      }
    };
    reader.readAsDataURL(file);

    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle Voice Note Playback
  const handleTogglePlayVoice = (msgId: string, audioUrl?: string) => {
    sounds.playClick();
    if (audioUrl) {
      voiceRecorder.playVoiceNote(msgId, audioUrl);
    } else {
      if (playingVoiceId === msgId) {
        voiceRecorder.stopPlayback();
      } else {
        voiceRecorder.playVoiceNote(msgId, '');
      }
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const avatarUrl =
    activeSeller.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeSeller.avatarSeed || activeSeller.name}`;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[750px] bg-slate-950/95 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-fadeIn relative">
      {/* Hidden file input for images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-3 overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Attachment Preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Voice Call Room Modal Overlay */}
      {isCallModalOpen && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-lg flex flex-col justify-between p-6 animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {callStatus === 'connecting'
                ? 'সংযুক্ত হচ্ছে...'
                : '🟢 এনক্রিপ্টেড ভয়েস সেশন'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-lime-400/20 hover:bg-lime-400/30 text-lime-300 border border-lime-400/40 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-lime-400/10"
                title="লাইভ লোকেশন ম্যাপ ট্র্যাক করুন"
              >
                <MapPin className="w-3.5 h-3.5 animate-bounce text-lime-400" />
                <span>লাইভ লোকেশন ম্যাপ</span>
              </button>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {activeSeller.service}
              </span>
            </div>
          </div>

          {/* Center Call Visualizer */}
          <div className="flex flex-col items-center justify-center space-y-4 my-auto">
            {/* Host Avatar with animated glow */}
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-full p-1 transition-all duration-700 ${
                  callStatus === 'connected'
                    ? 'bg-gradient-to-tr from-lime-400 to-emerald-500 shadow-2xl shadow-emerald-500/40 animate-pulse'
                    : 'bg-slate-700'
                }`}
              >
                <img
                  src={avatarUrl}
                  alt={activeSeller.name}
                  className="w-full h-full rounded-full object-cover bg-slate-900"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-lime-400 border-2 border-slate-950 rounded-full"></span>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-white">{activeSeller.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {callStatus === 'connecting'
                  ? 'কল ডায়াল করা হচ্ছে...'
                  : `কল চলছে: ${formatDuration(callDuration)}`}
              </p>
              {/* Interactive Caller Location Pill */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-lime-400/15 hover:bg-lime-400/25 border border-lime-400/30 rounded-full text-xs font-semibold text-lime-300 transition active:scale-95 cursor-pointer shadow-sm shadow-lime-400/10"
              >
                <MapPin className="w-3.5 h-3.5 text-lime-400 animate-bounce" />
                <span>📍 লাইভ লোকেশন ম্যাপ ভিউ</span>
              </button>
            </div>

            {/* Dynamic Audio Frequency Waveform */}
            {callStatus === 'connected' && (
              <div className="flex items-center gap-1.5 h-12 py-2">
                {liveAudioLevels.map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${isMuted ? 8 : Math.max(15, height)}%` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-lime-400 transition-all duration-100"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Call Action Buttons */}
          <div className="flex items-center justify-center gap-5 pt-4 border-t border-slate-800">
            {/* Mute Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                webrtcVoice.toggleMute(nextMuted);
              }}
              className={`p-4 rounded-full transition active:scale-95 cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 transition active:scale-95 cursor-pointer"
              title="কল শেষ করুন"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsSpeakerOn(!isSpeakerOn);
              }}
              className={`p-4 rounded-full transition active:scale-95 cursor-pointer ${
                isSpeakerOn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title={isSpeakerOn ? 'স্পিকার অন' : 'স্পিকার অফ'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Top Host & Session Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onBackToList();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
            title="ইনবক্সে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Host Avatar with Online Badge */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 p-0.5 shadow">
              <img
                src={avatarUrl}
                alt={activeSeller.name}
                className="w-full h-full rounded-full bg-slate-950 object-cover"
              />
            </div>
            {activeSeller.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-lime-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
            )}
          </div>

          {/* Host info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
                {activeSeller.name}
              </h4>
              <span className="text-[10px] text-lime-400 bg-lime-950/60 px-1.5 py-0.2 rounded border border-lime-500/30">
                🟢 লাইভ
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> বরাদ্দ: {activeSeller.purchasedTime || 30} মিনিট
              </span>
              {isAdmin && activeSeller.phone && (
                <span className="text-cyan-400 font-mono hidden sm:inline">• {activeSeller.phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Voice Call & Session Management */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/40 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-lime-500/10"
            title="লাইভ লোকেশন ট্র্যাক করুন"
          >
            <MapPin className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">লোকেশন</span>
          </button>

          <button
            type="button"
            onClick={handleStartCall}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/10"
            title="লাইভ ভয়েস কল শুরু করুন"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ভয়েস কল</span>
          </button>

          <button
            type="button"
            onClick={() => onHireDeveloper(activeSeller)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <Gem className="w-3.5 h-3.5" />
            <span>সেশন বাড়ান</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playCancel();
              onSessionEnd();
            }}
            className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>সেশন শেষ</span>
          </button>
        </div>
      </div>

      {/* Security & Real-Time Encryption Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/20 px-3.5 py-2 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 truncate">
          <Radio className="w-3 h-3 text-lime-400 animate-pulse shrink-0" />
          <span className="truncate">রিয়েল-টাইম লাইভ এনক্রিপ্টেড চ্যাট ও অডিও চ্যানেল সক্রিয়</span>
        </div>
        <span className="text-[10px] text-lime-400 bg-lime-950/90 px-2 py-0.5 rounded border border-lime-500/30 font-mono font-bold shrink-0">
          ১০০% সুরক্ষিত
        </span>
      </div>

      {/* Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Welcome Notice */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center max-w-sm mx-auto space-y-1 shadow-inner">
          <div className="w-8 h-8 rounded-full bg-lime-500/10 text-lime-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-200">
            {activeSeller.name} এর সাথে লাইভ চ্যাটরুম
          </p>
          <p className="text-[10px] text-slate-400">
            এখানে সরাসরি টেক্সট, ভয়েস নোট এবং প্রজেক্টের স্ক্রিনশট আদান-প্রদান করতে পারবেন।
          </p>
        </div>

        {/* Message Bubbles */}
        {sellerMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isAdminMsg = msg.sender === 'admin';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-fadeIn`}
            >
              <div className="flex items-end gap-1.5 max-w-[85%]">
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 p-0.5 shrink-0 mb-1 border border-lime-500/40">
                    <img
                      src={avatarUrl}
                      alt="Host"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed shadow-md space-y-2 ${
                    isUser
                      ? 'bg-gradient-to-r from-lime-500 to-emerald-600 text-slate-950 font-medium rounded-br-none'
                      : isAdminMsg
                      ? 'bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500/40 text-purple-100 rounded-bl-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {isAdminMsg && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300 pb-1 border-b border-purple-500/20">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      <span>মাস্টার অ্যাডমিন ডেস্ক</span>
                    </div>
                  )}

                  {/* Text content */}
                  {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                  {/* Order Card if present */}
                  {msg.isOrderCard && msg.orderInfo && (
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-lime-500/30 text-white space-y-1.5 my-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lime-400 text-xs">
                          📦 অর্ডার #{msg.orderInfo.orderId}
                        </span>
                        <span className="text-[10px] bg-lime-500/20 text-lime-300 px-2 py-0.5 rounded font-mono font-bold">
                          {msg.orderInfo.diamonds} 💎
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{msg.orderInfo.serviceName}</p>
                    </div>
                  )}

                  {/* Image Attachment */}
                  {msg.attachment?.type === 'image' && (
                    <div className="rounded-xl overflow-hidden border border-slate-700/60 my-1 relative group cursor-pointer" onClick={() => setPreviewImageUrl(msg.attachment!.url)}>
                      <img
                        src={msg.attachment.url}
                        alt="Attachment"
                        className="w-full max-h-48 object-cover rounded-xl hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>জুম করুন</span>
                      </div>
                    </div>
                  )}

                  {/* Voice Note Attachment */}
                  {msg.attachment?.type === 'voice' && (
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-lime-500/30 flex items-center gap-3 min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayVoice(msg.id, msg.attachment?.url)}
                        className={`w-9 h-9 rounded-full ${
                          playingVoiceId === msg.id
                            ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                            : 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-md shadow-lime-400/20'
                        } flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0`}
                        title={playingVoiceId === msg.id ? 'পজ করুন' : 'শুনুন'}
                      >
                        {playingVoiceId === msg.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 flex flex-col justify-center gap-1">
                        {/* Dynamic Animated Waveform */}
                        <div className="flex items-center gap-1 h-6">
                          {[14, 26, 18, 30, 16, 24, 12, 28, 18, 22].map((h, idx) => (
                            <span
                              key={idx}
                              style={{
                                height: `${
                                  playingVoiceId === msg.id
                                    ? Math.min(28, Math.max(8, (h * (playbackProgress + 20)) % 30))
                                    : Math.max(8, h)
                                }px`,
                              }}
                              className={`w-1 rounded-full transition-all duration-150 ${
                                playingVoiceId === msg.id
                                  ? 'bg-lime-400 animate-pulse'
                                  : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Playback progress bar */}
                        {playingVoiceId === msg.id && (
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-lime-400 h-full transition-all duration-100"
                              style={{ width: `${Math.min(100, playbackProgress)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-300 font-bold shrink-0">
                        {msg.attachment.duration || 3}s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp & Read Receipts */}
              <div className="flex items-center gap-1 text-[10px] text-slate-500 px-1 font-mono">
                <span>{msg.timestamp}</span>
                {isUser && <CheckCheck className="w-3 h-3 text-lime-400" />}
              </div>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-lime-400 italic bg-slate-900/60 p-2.5 rounded-2xl w-fit border border-slate-800 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
            <span>{activeSeller.name} উত্তর লিখছেন...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 p-2 px-3 flex gap-1.5 overflow-x-auto scrollbar-none text-xs">
        {[
          'হ্যালো, কেমন আছেন?',
          'কাজের আপডেট কি?',
          'ভয়েস কল প্রস্তুত কি?',
          'স্ক্রিনশট পাঠাচ্ছি',
          'ধন্যবাদ!',
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-950 text-slate-300 hover:text-lime-300 border border-slate-800 hover:border-lime-500/40 text-[11px] font-medium transition cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Voice Note Recording Bar */}
      {isRecordingVoice ? (
        <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>{formatDuration(recordSeconds)}</span>
            </div>

            {/* Live Visualizer Equalizer */}
            <div className="flex items-center gap-1 h-5 px-2 bg-slate-950/70 rounded-lg border border-rose-500/20">
              {liveRecordLevels.map((lvl, i) => (
                <span
                  key={i}
                  style={{ height: `${Math.max(15, lvl)}%` }}
                  className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-amber-400 transition-all duration-100"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelVoiceRecording}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSendVoiceRecording}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>পাঠান</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Chat Input Footer */
        <form
          onSubmit={handleSend}
          className="bg-slate-900 border-t border-slate-800 p-2.5 sm:p-3 flex items-center gap-2"
        >
          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-lime-400 border border-slate-800 transition cursor-pointer shrink-0"
            title="স্ক্রিনশট বা ছবি সংযুক্ত করুন"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Record Voice Note Button */}
          <button
            type="button"
            onClick={handleStartVoiceRecording}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition cursor-pointer shrink-0"
            title="ভয়েস নোট রেকর্ড করুন"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${activeSeller.name}-কে মেসেজ পাঠান...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-lime-500 shadow-inner"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
      {/* Live Location Tracking Modal */}
      <LiveLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        targetUserName={activeSeller.name}
        targetUserRole="হোস্ট"
      />
    </div>
  );
};
