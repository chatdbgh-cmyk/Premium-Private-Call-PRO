import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { Send, Bot, ShieldCheck, User } from 'lucide-react';
import { sounds } from '../utils/sound';

interface ChatBoxProps {
  currentUserId: string;
  currentUserName: string;
  chatPartnerId: string;
  chatPartnerName?: string;
  initialMessages?: ChatMessage[];
  onSendMessage?: (message: ChatMessage) => void;
  autoReplyEnabled?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  currentUserId,
  currentUserName,
  chatPartnerId,
  chatPartnerName = 'হোস্ট সাপোর্ট',
  initialMessages,
  onSendMessage,
  autoReplyEnabled = true,
}) => {
  const storageKey = `pts_chat_${currentUserId}_${chatPartnerId}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: `MSG-INIT-1`,
        senderId: chatPartnerId,
        receiverId: currentUserId,
        senderName: chatPartnerName,
        message: 'স্বাগতম! যেকোনো প্রশ্ন বা সাহায্যের জন্য এখানে মেসেজ করতে পারেন। অটো-সাপোর্ট বট সর্বদা সক্রিয়।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages, storageKey]);

  // Handle message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const newMessage: ChatMessage = {
      id: `MSG-${Date.now()}`,
      senderId: currentUserId,
      receiverId: chatPartnerId,
      senderName: currentUserName,
      message: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    if (onSendMessage) {
      onSendMessage(newMessage);
    }
    setInputMessage('');
    sounds.playSend();

    // Auto Reply Bot logic
    if (autoReplyEnabled) {
      setTimeout(() => {
        let replyText = 'আপনার মেসেজটি সাপোর্ট সিস্টেমে জমা হয়েছে। অ্যাডমিন বা হোস্ট শীঘ্রই আপনার সাথে যোগাযোগ করবেন।';
        const lower = userText.toLowerCase();

        if (lower.includes('পেমেন্ট') || lower.includes('টাকা') || lower.includes('recharge') || lower.includes('bkash') || lower.includes('nagad')) {
          replyText = '💎 পেমেন্ট সম্পূর্ণ করতে ওয়ালেট অপশনে গিয়ে Send Money করুন এবং ট্রানজেকশন আইডি (TxID) সাবমিট করুন। অ্যাডমিন দ্রুত ডায়মন্ড যুক্ত করে দেবেন।';
        } else if (lower.includes('ডায়মন্ড') || lower.includes('diamond') || lower.includes('রেট') || lower.includes('rate')) {
          replyText = '⚡ ডায়মন্ড রেট: ১০০ টাকায় ১০০ ডায়মন্ড! ১০০০+ ডায়মন্ড রিচার্জে অতিরিক্ত ২০% বোনাস ডিসকাউন্ট অফার চলছে।';
        } else if (lower.includes('অর্ডার') || lower.includes('সময়') || lower.includes('স্লট') || lower.includes('বুক')) {
          replyText = '🎙️ হোম পেজ থেকে পছন্দের হোস্টের (+ ১ ঘণ্টা) স্লট বুকিং করুন। প্রতি ১ ঘণ্টার জন্য নির্ধারিত ডায়মন্ড চার্জ হবে।';
        } else if (lower.includes('hello') || lower.includes('হাই') || lower.includes('কেমন') || lower.includes('সালাম')) {
          replyText = '👋 আসসালামু আলাইকুম! আমি সাপোর্ট অ্যাসিস্ট্যান্ট বট। কীভাবে আপনাকে সাহায্য করতে পারি?';
        }

        const botReply: ChatMessage = {
          id: `MSG-BOT-${Date.now()}`,
          senderId: chatPartnerId,
          receiverId: currentUserId,
          senderName: chatPartnerName,
          message: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
        };

        setMessages((prev) => [...prev, botReply]);
        if (onSendMessage) {
          onSendMessage(botReply);
        }
        sounds.playReceive();
      }, 700);
    }
  };

  return (
    <div className="flex flex-col h-[420px] bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white shadow-xl">
      {/* চ্যাট হেডার */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>{chatPartnerName}</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800/50">
                {chatPartnerId}
              </span>
            </h4>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              রিয়েল-টাইম ডাটাবেজ চ্যাট সক্রিয়
            </p>
          </div>
        </div>
      </div>

      {/* চ্যাট এরিয়া */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 px-1">
                <span>{msg.senderName}</span>
                <span className="text-[9px] text-slate-500 font-mono">({msg.senderId})</span>
              </div>
              <div
                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-md ${
                  isMe
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.message}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* ইনপুট বক্স */}
      <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 pt-2 border-t border-slate-800/60">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="মেসেজ লিখুন..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
        />
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>পাঠান</span>
        </button>
      </form>
    </div>
  );
};
