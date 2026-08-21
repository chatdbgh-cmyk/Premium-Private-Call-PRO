import React, { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Settings,
  ExternalLink,
  Users,
  RefreshCw,
  X
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { realtimeBus } from '../utils/realtime';

declare global {
  interface Window {
    MeteredFrame?: any;
  }
}

interface MeteredVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName?: string;
  callerName?: string;
  targetName?: string;
  isHost?: boolean;
}

export const MeteredVideoModal: React.FC<MeteredVideoModalProps> = ({
  isOpen,
  onClose,
  roomName = 'tutorial',
  callerName = 'কাস্টমার',
  targetName = 'সেলার / হোস্ট',
  isHost = false,
}) => {
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('pts_metered_app_name') || 'yourappname';
  });
  const [customRoom, setCustomRoom] = useState(() => {
    return localStorage.getItem('pts_metered_room_name') || roomName;
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameInstanceRef = useRef<any>(null);

  // Derived full Room URL
  const cleanApp = appName.trim().replace(/\.metered\.live.*$/, '').replace(/https?:\/\//, '');
  const cleanRoom = customRoom.trim().replace(/^\//, '');
  const computedRoomUrl = `${cleanApp || 'yourappname'}.metered.live/${cleanRoom || 'tutorial'}`;
  const fullHttpsUrl = `https://${computedRoomUrl}`;

  // Initialize Metered Frame
  const initMeteredFrame = () => {
    setIsLoading(true);
    setSdkError(null);

    const container = containerRef.current;
    if (!container) return;

    // Clear previous children
    container.innerHTML = '';

    try {
      const initFrame = () => {
        if (typeof window !== 'undefined' && window.MeteredFrame) {
          const frame = new window.MeteredFrame();
          frameInstanceRef.current = frame;

          // Initializing the Frame with width and height options
          frame.init(
            {
              roomURL: computedRoomUrl,
              width: "100%",
              height: "100%",
            },
            container
          );

          setIsLoading(false);
        } else {
          // Direct embedded iframe fallback with full WebRTC permissions
          const iframe = document.createElement('iframe');
          iframe.src = fullHttpsUrl;
          iframe.allow = 'camera; microphone; display-capture; autoplay; clipboard-write; fullscreen';
          iframe.className = 'w-full h-full border-0 rounded-2xl bg-slate-950';
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.minHeight = '480px';
          iframe.onload = () => setIsLoading(false);
          iframe.onerror = () => {
            setIsLoading(false);
            setSdkError('Metered রুম লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে App Domain ও Room Name চেক করুন।');
          };
          container.appendChild(iframe);
        }
      };

      // Check if script is loaded, else inject dynamically
      if (typeof window !== 'undefined' && !window.MeteredFrame && !document.querySelector('script[src*="sdk-frame"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js';
        script.async = true;
        script.onload = () => {
          initFrame();
        };
        script.onerror = () => {
          initFrame();
        };
        document.body.appendChild(script);
      } else {
        initFrame();
      }
    } catch (err: any) {
      console.error('Metered Frame Init Error:', err);
      setIsLoading(false);
      setSdkError(err?.message || 'মিটারড ভিডিও ফ্রেম ইনিশিয়ালাইজেশন ত্রুটি।');
    }
  };

  useEffect(() => {
    if (isOpen) {
      sounds.playCallRing();
      initMeteredFrame();

      // Broadcast video call invite event
      realtimeBus.broadcast('NEW_MESSAGE', {
        id: `METERED-CALL-${Date.now()}`,
        sender: 'bot',
        text: `📹 [HD ভিডিও মিটিং শুরু]: ${callerName} একটি Metered লাইভ ভিডিও সেশন চালু করেছেন। লিঙ্ক: ${fullHttpsUrl}`,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    return () => {
      if (frameInstanceRef.current && typeof frameInstanceRef.current.dispose === 'function') {
        try {
          frameInstanceRef.current.dispose();
        } catch (e) {
          console.warn('Metered dispose warning:', e);
        }
      }
    };
  }, [isOpen, appName, customRoom]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullHttpsUrl);
    setIsCopied(true);
    sounds.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pts_metered_app_name', appName);
    localStorage.setItem('pts_metered_room_name', customRoom);
    setIsConfigOpen(false);
    initMeteredFrame();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-slate-950 border border-slate-800 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-none'
            : 'w-full max-w-5xl h-[92vh] max-h-[850px] rounded-3xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  Metered HD ভিডিও মিটিং
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  WebRTC Live
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {callerName} ↔ {targetName} | <span className="font-mono text-lime-400">{computedRoomUrl}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Copy Room Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="রুম লিঙ্ক কপি করুন"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{isCopied ? 'কপি হয়েছে' : 'মিটিং লিঙ্ক'}</span>
            </button>

            {/* Room Settings */}
            <button
              type="button"
              onClick={() => setIsConfigOpen((v) => !v)}
              className={`p-2 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                isConfigOpen
                  ? 'bg-lime-400 text-slate-950 border-lime-400 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Metered App & Room সেটিংস"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95 cursor-pointer"
              title={isFullscreen ? 'মিনিমাইজ' : 'ফুল স্ক্রিন'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Open in New Tab */}
            <a
              href={fullHttpsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95 cursor-pointer"
              title="নতুন ট্যাবে ওপেন করুন"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* End Call / Close */}
            <button
              type="button"
              onClick={() => {
                sounds.playCancel();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-lg shadow-rose-600/30 cursor-pointer"
              title="ভিডিও মিটিং শেষ করুন"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লিভ মিটিং</span>
            </button>
          </div>
        </div>

        {/* Configuration Drawer (if toggled) */}
        {isConfigOpen && (
          <div className="bg-slate-900 border-b border-slate-800 p-4 animate-fadeIn">
            <form onSubmit={handleSaveConfig} className="max-w-xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lime-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Metered Video App & Room কনফিগারেশন
                </span>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Metered App Name / ডোমেন
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="yourappname"
                      className="w-full bg-slate-950 border border-slate-700 rounded-l-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400 font-mono"
                    />
                    <span className="bg-slate-800 border border-l-0 border-slate-700 px-2 py-1.5 text-[10px] text-slate-400 rounded-r-xl font-mono">
                      .metered.live
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    রুমের নাম (Room Name)
                  </label>
                  <input
                    type="text"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    placeholder="tutorial"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  বর্তমান URL: <span className="text-lime-300 font-mono">{fullHttpsUrl}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={initMeteredFrame}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> রিলোড
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-bold rounded-lg shadow"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Video Frame Display Container */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-lime-400/20 border-t-lime-400 rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-300 font-mono">
                Metered Video WebRTC ফ্রেম লোড হচ্ছে...
              </p>
            </div>
          )}

          {/* Error Message */}
          {sdkError && (
            <div className="absolute top-4 inset-x-4 z-20 p-3 bg-rose-950/90 border border-rose-600/50 rounded-2xl text-xs text-rose-200 flex items-center justify-between">
              <span>{sdkError}</span>
              <button
                onClick={() => setSdkError(null)}
                className="p-1 hover:bg-rose-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* The Exact Metered Frame Div required by Metered SDK */}
          <div
            id="metered-frame"
            ref={containerRef}
            className="w-full h-full flex items-center justify-center min-h-[480px]"
          >
            {/* Metered SDK or Fallback Iframe attaches here */}
          </div>
        </div>

        {/* Bottom Status Info Strip */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> এন্ড-টু-এন্ড WebRTC এনক্রিপশন সক্রিয়
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-lime-400" /> আনলিমিটেড পার্টিসিপেন্ট সাপোর্ট
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-slate-200 font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              Metered.ca Video SDK v1.4.3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
