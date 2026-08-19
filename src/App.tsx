import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ViewType,
  Developer,
  ChatMessage,
  PaymentRequest,
  SellerWithdrawRequest,
  ServiceOrder,
  PaymentSettings,
  PaymentMethod,
  SiteConfig,
  UserAccount,
  BotAutoReply,
  UserSession,
  BookedSlotInfo,
} from './types';
import {
  INITIAL_DEVELOPERS,
  INITIAL_SETTINGS,
  INITIAL_SITE_CONFIG,
  INITIAL_USERS,
  INITIAL_BOT_REPLIES,
  INITIAL_WITHDRAW_REQUESTS,
} from './data/initialData';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { OrdersView } from './components/OrdersView';
import { ProfileView } from './components/ProfileView';
import { HireModal } from './components/HireModal';
import { MasterAdminPanel } from './components/MasterAdminPanel';
import { LoginVerification } from './components/LoginVerification';
import { SellerPortal } from './components/SellerPortal';
import { EntrancePopupBanner } from './components/EntrancePopupBanner';
import { ToastContainer, ToastMessage } from './components/Toast';
import { sounds } from './utils/sound';
import { realtimeBus } from './utils/realtime';
import { isOwnerCredentials, OWNER_EMAIL, OWNER_PASSWORD } from './utils/auth';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<ViewType>('home');

  // Users state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('site_users');
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Ensure Owner account is always present
          const hasOwner = parsed.some((u) => u.id === 'USR-OWNER' || u.name.toLowerCase() === OWNER_EMAIL);
          if (!hasOwner) {
            const ownerAcc: UserAccount = {
              id: 'USR-OWNER',
              name: OWNER_EMAIL,
              username: '@plabon_owner',
              bio: '👑 সিস্টেম ওনার ও মাস্টার ডাটাবেজ কন্ট্রোলার',
              phone: OWNER_PASSWORD,
              password: OWNER_PASSWORD,
              diamonds: 999999,
              isBanned: false,
              joinedDate: '2026-08-14',
              role: 'owner',
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=OwnerPlabon',
            };
            return [ownerAcc, ...parsed];
          }
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('active_user_id');
    return saved || 'USR-CUSTOMER';
  });

  // User session state
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'রাকিবুল হাসান (কাস্টমার)',
      phone: '01712-345678',
      sessionId: 'CUST-DEFAULT-101',
      userId: 'USR-CUSTOMER',
      role: 'customer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CustomerRakib',
      loginAt: 'সক্রিয়',
    };
  });

  // Active User object synced with userSession
  const activeUser =
    (userSession?.role === 'owner'
      ? users.find((u) => u.id === 'USR-OWNER' || u.name.toLowerCase() === OWNER_EMAIL)
      : userSession?.role === 'seller'
      ? users.find((u) => u.sellerId === userSession.sellerId || u.name.toLowerCase() === userSession.name.toLowerCase())
      : users.find((u) => u.id === currentUserId || u.name.toLowerCase() === userSession?.name.toLowerCase() || u.phone === userSession?.phone)) ||
    users.find((u) => u.id === currentUserId) ||
    users[0] ||
    INITIAL_USERS[0];
  const diamonds = activeUser.diamonds;

  // Roles verification strictly determined by current active session
  const isOwner = userSession?.role === 'owner' || userSession?.isOwner === true;
  const isSeller = userSession?.role === 'seller';

  const [developers, setDevelopers] = useState<Developer[]>(() => {
    const saved = localStorage.getItem('developers_data');
    if (saved) {
      try {
        const parsed: Developer[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Merge with INITIAL_DEVELOPERS to ensure new fields like bookedSlots & username are preserved
          return parsed.map((pDev) => {
            const initMatch = INITIAL_DEVELOPERS.find((d) => d.id === pDev.id);
            return {
              ...initMatch,
              ...pDev,
              bookedSlots: (pDev.bookedSlots && pDev.bookedSlots.length > 0) ? pDev.bookedSlots : (initMatch?.bookedSlots || []),
              bookedHours: typeof pDev.bookedHours === 'number' ? Math.max(pDev.bookedHours, pDev.bookedSlots?.length || 0, initMatch?.bookedHours || 0) : (initMatch?.bookedHours || 0),
            };
          });
        }
      } catch {}
    }
    return INITIAL_DEVELOPERS;
  });

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem('payment_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [withdrawRequests, setWithdrawRequests] = useState<SellerWithdrawRequest[]>(() => {
    const saved = localStorage.getItem('seller_withdraw_requests');
    return saved ? JSON.parse(saved) : INITIAL_WITHDRAW_REQUESTS;
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('service_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: '👋 হ্যালো! আমাদের প্রাইভেট চ্যাট ও সার্ভিস প্ল্যাটফর্মে আপনাকে স্বাগতম। আপনি এখান থেকে সেরা ডেভেলপার ও হোস্টদের সাথে সরাসরি কথা বলে ডায়মন্ডের মাধ্যমে যেকোনো সার্ভিস নিতে পারবেন।',
        timestamp: 'এখন',
      },
    ];
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    const saved = localStorage.getItem('payment_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('site_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.siteName === 'প্রাইভেট চ্যাট ও সার্ভিস হাব' || !parsed.siteName) {
          parsed.siteName = 'PTS';
        }
        return parsed;
      } catch {}
    }
    return INITIAL_SITE_CONFIG;
  });

  const [botReplies, setBotReplies] = useState<BotAutoReply[]>(() => {
    const saved = localStorage.getItem('bot_replies');
    return saved ? JSON.parse(saved) : INITIAL_BOT_REPLIES;
  });

  // UI Flow States
  const [activeDevForChat, setActiveDevForChat] = useState<Developer | null>(null);
  const [selectedDevForHire, setSelectedDevForHire] = useState<Developer | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('site_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('active_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('developers_data', JSON.stringify(developers));
  }, [developers]);

  useEffect(() => {
    localStorage.setItem('payment_requests', JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  useEffect(() => {
    localStorage.setItem('seller_withdraw_requests', JSON.stringify(withdrawRequests));
  }, [withdrawRequests]);

  useEffect(() => {
    localStorage.setItem('service_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('payment_settings', JSON.stringify(paymentSettings));
  }, [paymentSettings]);

  useEffect(() => {
    localStorage.setItem('site_config', JSON.stringify(siteConfig));
  }, [siteConfig]);

  useEffect(() => {
    localStorage.setItem('bot_replies', JSON.stringify(botReplies));
  }, [botReplies]);

  // Listen to realtime events
  useEffect(() => {
    const unsubscribe = realtimeBus.subscribe((event) => {
      if (event.type === 'NEW_MESSAGE') {
        const incomingMsg: ChatMessage = event.data;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
        if (incomingMsg.sender !== 'user') {
          sounds.playReceive();
        }
      } else if (event.type === 'PAYMENT_UPDATED') {
        const savedPayments = localStorage.getItem('payment_requests');
        if (savedPayments) {
          try {
            setPaymentRequests(JSON.parse(savedPayments));
          } catch {}
        }
        const savedUsers = localStorage.getItem('site_users');
        if (savedUsers) {
          try {
            setUsers(JSON.parse(savedUsers));
          } catch {}
        }
      } else if (event.type === 'ORDER_UPDATED') {
        const savedOrders = localStorage.getItem('service_orders');
        if (savedOrders) {
          try {
            setOrders(JSON.parse(savedOrders));
          } catch {}
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Toast Helpers
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCopyText = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast(`নম্বরটি কপি করা হয়েছে: ${text}`, 'success');
      sounds.playReceive();
    } catch {
      showToast(`কপি হয়েছে: ${text}`, 'success');
    }
  };

  // View title helper
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'home':
        return 'হোম ড্যাশবোর্ড';
      case 'chat':
        return activeDevForChat ? `${activeDevForChat.name}` : 'প্রাইভেট চ্যাট ও সাপোর্ট';
      case 'orders':
        return 'আপনার সার্ভিস অর্ডার';
      case 'profile':
        return `প্রোফাইল (${activeUser.name})`;
      case 'admin':
        return '👑 ওনার ডাটাবেজ কন্ট্রোল প্যানেল';
      case 'seller_portal':
        return '🛍️ সেলার শপ পোর্টাল';
    }
  };

  // Chat message sending
  const handleSendMessage = (
    text: string,
    devId?: number,
    attachment?: ChatMessage['attachment'],
    senderOverride?: 'user' | 'bot' | 'developer' | 'admin'
  ) => {
    const sender = senderOverride || (isSeller ? 'developer' : isOwner ? 'admin' : 'user');
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender,
      senderName:
        sender === 'admin'
          ? '👑 ওনার অ্যাডমিন'
          : sender === 'developer'
          ? activeUser.name
          : activeUser.name,
      text,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      developerId: devId,
      attachment,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    realtimeBus.broadcast('NEW_MESSAGE', newMsg);

    // If sent by regular user, trigger simulated live response
    if (sender === 'user') {
      realtimeBus.broadcast('TYPING_START', { developerId: devId });

      setTimeout(() => {
        let botReplyText = '';
        const lower = text.toLowerCase();

        // Check custom rules from admin panel first
        const matchedRule = botReplies.find((r) => {
          if (!r.enabled) return false;
          const keywords = r.trigger.toLowerCase().split(/[\/,|]/).map((k) => k.trim());
          return keywords.some((k) => k && lower.includes(k));
        });

        if (matchedRule) {
          botReplyText = matchedRule.response;
        } else if (devId) {
          const targetDev = developers.find((d) => d.id === devId);
          const devName = targetDev ? targetDev.name : 'হোস্ট';

          if (lower.includes('কবে') || lower.includes('সময়') || lower.includes('ডেলিভারি')) {
            botReplyText = `ধন্যবাদ ${activeUser.name}! আমার এই সার্ভিসটির ডেলিভারি সময় ${targetDev?.deliveryTime || '২-৩ দিন'}। যেকোনো সময় কথা বলতে ভয়েস কল করতে পারেন।`;
          } else if (lower.includes('অর্ডার') || lower.includes('হায়ার') || lower.includes('কাজ')) {
            botReplyText = `দারুণ! আপনি উপরে 'সেশন বাড়ান' বা 'হায়ার' বাটনে ক্লিক করে ${targetDev?.price} ডায়মন্ড দিয়ে অর্ডার কনফার্ম করতে পারেন।`;
          } else if (lower.includes('কল') || lower.includes('ভয়েস') || lower.includes('কথা')) {
            botReplyText = `হ্যাঁ ${activeUser.name}, আমি লাইভ অনলাইনে আছি! উপরের 'ভয়েস কল' বাটনে ক্লিক করলেই লাইভ অডিও রুমে সংযুক্ত হতে পারবেন।`;
          } else if (lower.includes('খরচ') || lower.includes('প্রাইস') || lower.includes('কত') || lower.includes('ডায়মন্ড')) {
            botReplyText = `এই সার্ভিসের চার্জ ${targetDev?.price} ডায়মন্ড। যদি কোনো বিশেষ রিকোয়ারমেন্ট থাকে, মেসেজে বা স্ক্রিনশটে জানাতে পারেন।`;
          } else {
            botReplyText = `নমস্কার ${activeUser.name}! ${devName} বলছি। আপনার বার্তা পেয়েছি। আমি রিয়েল-টাইমে আপনাকে সাপোর্ট দিতে প্রস্তুত।`;
          }
        } else {
          // General Support AI Bot
          if (lower.includes('প্যাকেজ') || lower.includes('রেট') || lower.includes('দাম') || lower.includes('মূল্য')) {
            botReplyText = `💎 আমাদের ডায়মন্ড রেট: ১ ডায়মন্ড = ${siteConfig.minRechargeAmount || 1} টাকা।\n\nবিশেষ বোনাস:\n• ৩০০ ডায়মন্ডে +৩০ বোনাস\n• ৫০০ ডায়মন্ডে +৭৫ বোনাস\n• ১০০০ ডায়মন্ডে +২০০ ভিআইপি বোনাস!\n\nরিচার্জ করতে প্রোফাইল অপশনে যান।`;
          } else if (lower.includes('বিকাশ') || lower.includes('নগদ') || lower.includes('রকেট') || lower.includes('রিচার্জ') || lower.includes('টাকা')) {
            botReplyText = `💳 বিকাশ/নগদে রিচার্জ করার নিয়ম:\n১. প্রোফাইল ট্যাবে যান।\n২. আমাদের নম্বরে (${paymentSettings.bkashNumber} / ${paymentSettings.nagadNumber}) Send Money করুন।\n৩. TrxID দিয়ে সাবমিট করুন। অ্যাডমিন ৫ মিনিটে ডায়মন্ড যুক্ত করে দেবে!`;
          } else if (lower.includes('হায়ার') || lower.includes('অর্ডার') || lower.includes('কিভাবে')) {
            botReplyText = '🚀 সার্ভিস নেওয়ার নিয়ম:\n১. হোম পেজ থেকে যেকোনো হোস্ট বা সার্ভিস পছন্দ করুন।\n২. "হায়ার করুন" বা "সেশন শুরু" বাটনে ক্লিক করুন।\n৩. ডায়মন্ড দিয়ে অর্ডার কনফার্ম করলেই লাইভ চ্যাট ও ভয়েস রুম চালু হয়ে যাবে!';
          } else {
            botReplyText = `ধন্যবাদ ${activeUser.name}! আপনার বার্তা পেয়েছি। যেকোনো সমস্যা বা রিচার্জ সংক্রান্ত সহায়তার জন্য আমাদের জানাতে পারেন।`;
          }
        }

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: devId ? 'developer' : 'bot',
          text: botReplyText,
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
          developerId: devId,
        };

        setChatMessages((prev) => [...prev, botMsg]);
        realtimeBus.broadcast('TYPING_STOP', { developerId: devId });
        realtimeBus.broadcast('NEW_MESSAGE', botMsg);
      }, 1100);
    }
  };

  // Order creation from Hire modal
  const handleConfirmHire = (
    developer: Developer,
    requirements: string,
    durationMinutes: number = 60,
    totalDiamonds?: number,
    durationText?: string
  ) => {
    const ratePerHour = developer.diamondPerHour || developer.price || 100;
    const cost = totalDiamonds ?? Math.ceil((ratePerHour / 60) * durationMinutes);

    if (diamonds < cost) {
      showToast(`পর্যাপ্ত ডায়মন্ড নেই! এই সেশনের জন্য ${cost} ডায়মন্ড প্রয়োজন।`, 'error');
      return;
    }

    // Deduct exact calculated diamonds from active user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id ? { ...u, diamonds: Math.max(0, u.diamonds - cost) } : u
      )
    );

    const formattedDuration = durationText || `${Math.floor(durationMinutes / 60)} ঘণ্টা ${durationMinutes % 60 ? `${durationMinutes % 60} মিনিট` : ''}`;

    const newOrderId = Math.floor(10000 + Math.random() * 90000).toString();
    const newOrder: ServiceOrder = {
      id: newOrderId,
      userId: activeUser.id,
      userName: activeUser.name,
      userAvatar: activeUser.avatar,
      userPhone: activeUser.phone,
      developerId: developer.id,
      developerName: developer.name,
      serviceName: `${developer.service} (${formattedDuration})`,
      developerService: developer.service,
      priceDiamonds: cost,
      durationMinutes,
      durationText: formattedDuration,
      date: new Date().toLocaleDateString('bn-BD'),
      status: 'in_progress',
      requirements,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedDevForHire(null);

    const nowTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

    // 1. Send order card into chat
    const orderChatMsg: ChatMessage = {
      id: `ORD-${Date.now()}`,
      sender: 'bot',
      text: `🎉 অভিনন্দন ${activeUser.name}! আপনি ${developer.name}-এর "${developer.service}" (${formattedDuration}) সফলভাবে বুক করেছেন। মোট খরচ: ${cost} 💎।`,
      timestamp: nowTime,
      developerId: developer.id,
      isOrderCard: true,
      orderInfo: {
        orderId: newOrderId,
        serviceName: `${developer.service} (${formattedDuration})`,
        diamonds: cost,
      },
    };

    // 2. Automatically send customer's link request message to host
    const userAutoMsg: ChatMessage = {
      id: `AUTO-REQ-${Date.now()}`,
      sender: 'user',
      text: 'পার্সোনাল লিংক টা দিন',
      timestamp: nowTime,
      developerId: developer.id,
    };

    setChatMessages((prev) => [...prev, orderChatMsg, userAutoMsg]);

    // 3. Immediately switch to host chatbox so user sees the message
    setActiveDevForChat(developer);
    setCurrentView('chat');

    // 4. Host acknowledgement after 1.5s
    setTimeout(() => {
      const hostReply: ChatMessage = {
        id: `HOST-ACK-${Date.now()}`,
        sender: 'bot',
        text: `হ্যালো ${activeUser.name}! আপনার ${formattedDuration}-এর বুকিং অর্ডার #${newOrderId} গ্রহণ করা হয়েছে। আমি পার্সোনাল সেশন লিঙ্ক ও বিস্তারিত প্রস্তুত করছি...`,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        developerId: developer.id,
      };
      setChatMessages((prev) => [...prev, hostReply]);
      sounds.playReceive();
    }, 1400);

    try {
      confetti({ particleCount: 75, spread: 75, origin: { y: 0.6 } });
    } catch {}

    sounds.playSuccess();
    showToast(`অর্ডার #${newOrderId} কনফার্ম হয়েছে! মোট ${cost} ডায়মন্ড কাটা হয়েছে।`, 'success');
  };

  // Payment Request Submission
  const handleSubmitPayment = (data: {
    method: PaymentMethod;
    diamonds: number;
    bdtAmount: number;
    senderPhone: string;
    lastDigits?: string;
    trxId: string;
  }) => {
    const newReq: PaymentRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      userId: activeUser.id,
      userName: activeUser.name,
      method: data.method,
      amountDiamonds: data.diamonds,
      bdtAmount: data.bdtAmount,
      senderPhone: data.senderPhone,
      lastDigits: data.lastDigits,
      trxId: data.trxId,
      date: new Date().toLocaleString('bn-BD'),
      status: 'pending',
    };

    setPaymentRequests((prev) => [newReq, ...prev]);
    showToast(`পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে (${activeUser.name})! অ্যাডমিন দ্রুত ভেরিফাই করবেন।`, 'success');
  };

  // Register or Auth User from Form
  const handleRegisterNewUser = (name: string, username: string, phone: string, password?: string) => {
    const existing = users.find(
      (u) =>
        u.name.toLowerCase() === name.toLowerCase() ||
        (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
        u.phone === phone
    );

    if (existing) {
      if (password && !existing.password) {
        setUsers((prev) => prev.map((u) => (u.id === existing.id ? { ...u, password } : u)));
      }
      setCurrentUserId(existing.id);
      showToast(`স্বাগতম ${existing.name}! প্রোফাইলে লগইন করা হয়েছে।`, 'success');
      sounds.playSuccess();
      return;
    }

    const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedUsername = username.startsWith('@') ? username : `@${username}`;
    const welcomeBonus = siteConfig.freeDiamondsOfferEnabled !== false ? (siteConfig.welcomeBonusDiamonds ?? 50) : 0;

    const newUser: UserAccount = {
      id: newId,
      name,
      username: formattedUsername,
      phone,
      password: password || '1234',
      diamonds: welcomeBonus,
      bio: '',
      isBanned: false,
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUserId(newId);
    showToast(
      `রেজিস্ট্রেশন সফল হয়েছে! ${welcomeBonus > 0 ? `🎉 +${welcomeBonus} 💎 ফ্রি ওয়েলকাম বোনাস যুক্ত হয়েছে!` : ''}`,
      'success'
    );
    sounds.playDiamond();
  };

  const handleUpdateBio = (userId: string, bio: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, bio } : u))
    );
    showToast('বায়ো সফলভাবে আপডেট করা হয়েছে!', 'success');
    sounds.playReceive();
  };

  // Admin Actions
  const handleApprovePayment = (reqId: string) => {
    const target = paymentRequests.find((r) => r.id === reqId);
    if (!target || target.status !== 'pending') return;

    const bonusPercent = siteConfig.freeDiamondsOfferEnabled !== false ? (siteConfig.rechargeBonusPercentage || 0) : 0;
    const flatBonus = siteConfig.freeDiamondsOfferEnabled !== false ? (siteConfig.rechargeFlatBonusDiamonds || 0) : 0;
    const bonusFromPercent = Math.floor((target.amountDiamonds * bonusPercent) / 100);
    const totalBonus = bonusFromPercent + flatBonus;
    const totalCredited = target.amountDiamonds + totalBonus;

    // Credit diamonds to target user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.userId || u.name === target.userName
          ? { ...u, diamonds: u.diamonds + totalCredited }
          : u
      )
    );

    // Update status
    setPaymentRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'approved' } : r))
    );

    showToast(
      `পেমেন্ট অনুমোদিত! +${target.amountDiamonds} 💎 ${totalBonus > 0 ? `(+${totalBonus} 💎 বোনাস)` : ''} (${target.userName}) ওয়ালেটে জমা হয়েছে।`,
      'success'
    );
  };

  const handleRejectPayment = (reqId: string) => {
    setPaymentRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'rejected' } : r))
    );
    showToast('পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে।', 'error');
  };

  // Withdraw actions
  const handleRequestWithdraw = (
    data: Omit<SellerWithdrawRequest, 'id' | 'sellerId' | 'sellerName' | 'sellerPhone' | 'requestedAt' | 'status'>
  ) => {
    const sellerDev = currentSellerDev;
    if (!sellerDev) {
      showToast('সেলার প্রোফাইল পাওয়া যায়নি!', 'error');
      return;
    }

    const newReq: SellerWithdrawRequest = {
      id: `WD-${Date.now().toString().slice(-6)}`,
      sellerId: sellerDev.id,
      sellerName: sellerDev.name,
      sellerPhone: sellerDev.phone || '01700-000000',
      amountDiamonds: data.amountDiamonds,
      bdtAmount: data.bdtAmount,
      paymentMethod: data.paymentMethod,
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      note: data.note,
      requestedAt: new Date().toLocaleString('bn-BD'),
      status: 'pending',
    };

    setWithdrawRequests((prev) => [newReq, ...prev]);
    showToast(`💎 ${data.amountDiamonds} ডায়মন্ড (৳ ${data.bdtAmount}) উইথড্র রিকোয়েস্ট ওনারের কাছে পাঠানো হয়েছে!`, 'success');
  };

  const handleApproveWithdraw = (reqId: string, adminTrxId?: string, note?: string) => {
    const target = withdrawRequests.find((r) => r.id === reqId);
    if (!target || target.status !== 'pending') return;

    setWithdrawRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'approved',
              adminTrxId: adminTrxId || `TX-${Date.now().toString().slice(-8)}`,
              adminNote: note,
              processedAt: new Date().toLocaleString('bn-BD'),
            }
          : r
      )
    );

    showToast(`✅ উইথড্র #${reqId} অনুমোদিত ও ${target.bdtAmount} টাকা পেইড মার্ক করা হয়েছে!`, 'success');
  };

  const handleRejectWithdraw = (reqId: string, note?: string) => {
    const target = withdrawRequests.find((r) => r.id === reqId);
    if (!target) return;

    setWithdrawRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'rejected',
              adminNote: note || 'ওনার কর্তৃক বাতিল ও রিফান্ড করা হয়েছে',
              processedAt: new Date().toLocaleString('bn-BD'),
            }
          : r
      )
    );

    showToast(`উইথড্র রিকোয়েস্ট #${reqId} বাতিল ও রিফান্ড করা হয়েছে।`, 'error');
  };

  const handleAddDiamondsDirectly = (amount: number, targetId?: string) => {
    const destinationId = targetId || activeUser.id;
    setUsers((prev) =>
      prev.map((u) => (u.id === destinationId ? { ...u, diamonds: u.diamonds + amount } : u))
    );
    const targetName = users.find((u) => u.id === destinationId)?.name || 'ইউজার';
    showToast(`অ্যাডমিন থেকে +${amount} 💎 (${targetName}) উপহার যুক্ত হয়েছে!`, 'success');
  };

  // Impersonate / Direct Bypass Access into any user or seller account
  const handleImpersonateUser = (target: UserAccount | Developer) => {
    if ('service' in target) {
      // It is a developer / seller:
      const dev = target as Developer;
      const sellerSession: UserSession = {
        name: dev.name,
        phone: dev.phone || '01700-000000',
        sessionId: `SELLER-${dev.id}-${Date.now().toString().slice(-4)}`,
        role: 'seller',
        sellerId: dev.id,
        isSeller: true,
        loginAt: 'অ্যাডমিন বাইপাস এক্সেস',
      };
      setUserSession(sellerSession);
      localStorage.setItem('user_session', JSON.stringify(sellerSession));
      setIsAdminOpen(false);
      setCurrentView('seller_portal');
      showToast(`⚡ অ্যাডমিন বাইপাস: সেলার (${dev.name}) অ্যাকাউন্টে সরাসরি প্রবেশ করা হয়েছে!`, 'success');
      sounds.playSuccess();
    } else {
      // It is a customer / user:
      const user = target as UserAccount;
      setCurrentUserId(user.id);
      localStorage.setItem('active_user_id', user.id);
      const userSess: UserSession = {
        name: user.name,
        phone: user.phone || '01700-000000',
        sessionId: `CUST-${user.id}`,
        role: user.role === 'owner' ? 'owner' : user.role === 'vip' ? 'vip' : 'user',
        isOwner: user.role === 'owner',
        loginAt: 'অ্যাডমিন বাইপাস এক্সেস',
      };
      setUserSession(userSess);
      localStorage.setItem('user_session', JSON.stringify(userSess));
      setIsAdminOpen(false);
      setCurrentView('profile');
      showToast(`⚡ অ্যাডমিন বাইপাস: ইউজার (${user.name} - ${user.id}) অ্যাকাউন্টে সরাসরি প্রবেশ করা হয়েছে!`, 'success');
      sounds.playSuccess();
    }
  };

  // Helper for slot time range
  const calculateSlotTimeRange = (slotIndex: number): string => {
    const startHour = 9 + slotIndex;
    const endHour = startHour + 1;
    const formatHour = (h: number) => {
      const period = h >= 12 && h < 24 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH.toString().padStart(2, '0')}:00 ${period}`;
    };
    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
  };

  // Host Time Slot Booking handler
  const handleBookSlot = (developerId: number, slotNumber: number) => {
    const targetDev = developers.find((d) => d.id === developerId);
    if (!targetDev) return;

    const cost = targetDev.diamondPerHour || 100;
    if (diamonds < cost) {
      showToast('আপনার পর্যাপ্ত ডায়মন্ড নেই! দয়া করে রিচার্জ করুন।', 'error');
      sounds.playError();
      setCurrentView('profile');
      return;
    }

    const currentBooked = targetDev.bookedHours || 0;
    const maxHrs = targetDev.maxAvailableHours || 10;

    if (currentBooked >= maxHrs) {
      showToast('সর্বোচ্চ সময় বুকিং সম্পন্ন হয়েছে! আর কোনো স্লট খালি নেই।', 'info');
      return;
    }

    // Deduct diamonds from active user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id ? { ...u, diamonds: Math.max(0, u.diamonds - cost) } : u
      )
    );

    // Booked Slot Info with avatar, name, and time range
    const timeRangeStr = calculateSlotTimeRange(slotNumber);
    const newBookedSlotInfo: BookedSlotInfo = {
      slotNumber,
      userId: activeUser.id,
      userName: activeUser.name,
      userAvatar: activeUser.avatar || userSession?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(activeUser.name)}`,
      bookedAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      timeRange: timeRangeStr,
      diamonds: cost,
    };

    // Increment booked hours and persist booked slot details
    const newBookedCount = currentBooked + 1;
    setDevelopers((prev) =>
      prev.map((d) =>
        d.id === developerId
          ? {
              ...d,
              bookedHours: newBookedCount,
              purchasedTime: (d.purchasedTime || 30) + 60,
              bookedSlots: [
                ...(d.bookedSlots || []).filter((s) => s.slotNumber !== slotNumber),
                newBookedSlotInfo,
              ],
            }
          : d
      )
    );

    // Create service order for record
    const newOrderId = Math.floor(10000 + Math.random() * 90000).toString();
    const newOrder: ServiceOrder = {
      id: newOrderId,
      userId: activeUser.id,
      developerId: targetDev.id,
      developerName: targetDev.name,
      serviceName: `১ ঘণ্টার ভয়েস/চ্যাট সেশন (স্লট #${slotNumber} [${timeRangeStr}])`,
      priceDiamonds: cost,
      date: new Date().toLocaleDateString('bn-BD'),
      status: 'in_progress',
      requirements: `স্লট #${slotNumber} (${timeRangeStr}) বুকিং সফল। রুম লিঙ্ক: ${targetDev.externalChatUrl || targetDev.telegram || 'https://t.me/alex_voice_chat'}`,
    };
    setOrders((prev) => [newOrder, ...prev]);

    const nowTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const orderChatMsg: ChatMessage = {
      id: `ORD-${Date.now()}`,
      sender: 'bot',
      text: `🎉 অভিনন্দন ${activeUser.name}! আপনি ${targetDev.name}-এর ১ ঘণ্টার লাইভ সেশন (স্লট #${slotNumber}: ${timeRangeStr}) বুক করেছেন।`,
      timestamp: nowTime,
      developerId: targetDev.id,
      isOrderCard: true,
      orderInfo: {
        orderId: newOrderId,
        serviceName: `১ ঘণ্টার সেশন (${timeRangeStr})`,
        diamonds: cost,
      },
    };

    const userAutoMsg: ChatMessage = {
      id: `AUTO-REQ-${Date.now()}`,
      sender: 'user',
      text: 'পার্সোনাল লিংক টা দিন',
      timestamp: nowTime,
      developerId: targetDev.id,
    };

    setChatMessages((prev) => [...prev, orderChatMsg, userAutoMsg]);

    // Open developer chatroom immediately
    setActiveDevForChat(targetDev);
    setCurrentView('chat');

    try {
      confetti({ particleCount: 65, spread: 65, origin: { y: 0.6 } });
    } catch {}

    sounds.playDiamond();
    showToast(`🎉 ${targetDev.name} এর ১ ঘণ্টা সেশন (${timeRangeStr}) বুক হয়েছে!`, 'success');
  };

  // Host settings updater
  const handleUpdateHostSettings = (developerId: number, isTimeSaleActive: boolean, maxAvailableHours: number) => {
    setDevelopers((prev) =>
      prev.map((d) =>
        d.id === developerId
          ? { ...d, isTimeSaleActive, maxAvailableHours: Math.max(1, maxAvailableHours) }
          : d
      )
    );
    showToast('হোস্ট সেটিংস সফলভাবে আপডেট হয়েছে!', 'success');
  };

  const handleAddDeveloper = (devData: Omit<Developer, 'id' | 'rating' | 'completedOrders' | 'online'>) => {
    const newDev: Developer = {
      ...devData,
      id: Date.now(),
      rating: 5.0,
      completedOrders: 0,
      online: true,
    };
    setDevelopers((prev) => [newDev, ...prev]);
    showToast('নতুন সার্ভিস সফলভাবে যুক্ত হয়েছে!', 'success');
  };

  const handleUpdateDeveloper = (id: number, updated: Partial<Developer>) => {
    setDevelopers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
    );
    showToast('সার্ভিস তথ্য আপডেট হয়েছে!', 'success');
  };

  const handleDeleteDeveloper = (devId: number) => {
    setDevelopers((prev) => prev.filter((d) => d.id !== devId));
    showToast('সার্ভিস ডিলিট করা হয়েছে।', 'info');
  };

  const handleUpdateOrderStatus = (orderId: string, status: ServiceOrder['status'], adminNote?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, ...(adminNote ? { adminNote } : {}) } : o))
    );
    showToast(`অর্ডার #${orderId} এর স্ট্যাটাস আপডেট করা হয়েছে!`, 'info');
  };

  const handleRefundOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetOrder.userId || u.id === activeUser.id
          ? { ...u, diamonds: u.diamonds + targetOrder.priceDiamonds }
          : u
      )
    );

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
    showToast(`অর্ডার #${orderId} রিফান্ড করা হয়েছে (+${targetOrder.priceDiamonds} 💎)`, 'success');
  };

  const handleCompleteOrderByUser = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
    );
    sounds.playSuccess();
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}
    showToast(`অর্ডার #${orderId} সফলভাবে রিসিভড কনফার্ম করা হয়েছে! ধন্যবাদ।`, 'success');
  };

  const handleDeleteOrderByUser = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`অর্ডার #${orderId} ডিলিট করা হয়েছে।`, 'info');
  };

  // User management
  const handleUpdateUser = (targetId: string, updated: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, ...updated } : u))
    );
    showToast('ইউজার প্রোফাইল আপডেট করা হয়েছে!', 'success');
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers((prev) => [newUser, ...prev]);
    showToast(`নতুন ইউজার ${newUser.name} যোগ করা হয়েছে!`, 'success');
  };

  // Bot Reply rules
  const handleAddBotReply = (reply: Omit<BotAutoReply, 'id'>) => {
    const newRule: BotAutoReply = {
      ...reply,
      id: `rep-${Date.now()}`,
    };
    setBotReplies((prev) => [...prev, newRule]);
    showToast('নতুন অটো-রিপ্লাই নিয়ম যোগ হয়েছে!', 'success');
  };

  const handleToggleBotReply = (id: string) => {
    setBotReplies((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteBotReply = (id: string) => {
    setBotReplies((prev) => prev.filter((r) => r.id !== id));
    showToast('অটো-রিপ্লাই নিয়ম মুছে ফেলা হয়েছে!', 'info');
  };

  // Login session verification handlers
  const handleLoginSession = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem('user_session', JSON.stringify(session));

    if (session.role === 'owner' || isOwnerCredentials(session.name, session.phone)) {
      // Find or set owner account
      let ownerAcc = users.find((u) => u.id === 'USR-OWNER' || u.name.toLowerCase() === OWNER_EMAIL);
      if (!ownerAcc) {
        ownerAcc = {
          id: 'USR-OWNER',
          name: OWNER_EMAIL,
          username: '@plabon_owner',
          bio: '👑 সিস্টেম ওনার ও মাস্টার ডাটাবেজ কন্ট্রোলার',
          phone: OWNER_PASSWORD,
          password: OWNER_PASSWORD,
          diamonds: 999999,
          isBanned: false,
          joinedDate: '2026-08-14',
          role: 'owner',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=OwnerPlabon',
        };
        setUsers((prev) => [ownerAcc!, ...prev]);
      }
      setCurrentUserId(ownerAcc.id);
      setIsAdminOpen(false);
      setCurrentView('admin');
      showToast('👑 ওনার ডাটাবেজ ও ফুল কন্ট্রোল আনলক হয়েছে!', 'success');
      sounds.playSuccess();
      return;
    }

    if (session.role === 'seller') {
      const dev = developers.find((d) => d.id === session.sellerId || d.name.toLowerCase() === session.name.toLowerCase());
      let sellerAcc = users.find((u) => u.sellerId === session.sellerId || u.name.toLowerCase() === session.name.toLowerCase());

      if (!sellerAcc && dev) {
        sellerAcc = {
          id: `USR-SELLER-${dev.id}`,
          name: dev.name,
          username: dev.username || `@${dev.name.toLowerCase()}`,
          phone: dev.phone || '01712345678',
          diamonds: 750,
          role: 'seller',
          sellerId: dev.id,
          joinedDate: 'আজকে',
          isBanned: false,
          avatar: dev.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${dev.name}`,
        };
        setUsers((prev) => [sellerAcc!, ...prev]);
      }

      if (sellerAcc) {
        setCurrentUserId(sellerAcc.id);
      }
      setIsAdminOpen(false);
      setCurrentView('seller_portal');
      showToast(`🛍️ সেলার পোর্টাল আনলক হয়েছে: ${dev?.name || session.name}`, 'success');
      sounds.playSuccess();
      return;
    }

    // Customer
    const existing = users.find(
      (u) => (session.userId && u.id === session.userId) || u.name.toLowerCase() === session.name.toLowerCase() || u.phone === session.phone
    );
    if (existing) {
      setCurrentUserId(existing.id);
      showToast(`স্বাগতম ${existing.name}! কাস্টমার সেশন সক্রিয়।`, 'success');
    } else {
      const newUserId = session.userId || `USR-${Math.floor(1000 + Math.random() * 9000)}`;
      const newUserObj: UserAccount = {
        id: newUserId,
        name: session.name,
        phone: session.phone,
        diamonds: 500,
        role: 'user',
        joinedDate: 'আজকে',
        isBanned: false,
        avatar: session.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${session.name}`,
      };
      setUsers((prev) => [newUserObj, ...prev]);
      setCurrentUserId(newUserId);
      showToast(`নতুন কাস্টমার একাউন্ট সক্রিয়: ${session.name}`, 'success');
    }
    setIsAdminOpen(false);
    setCurrentView('home');
    sounds.playSuccess();
  };

  const handleLogoutSession = () => {
    localStorage.removeItem('user_session');
    setUserSession(null);
    setCurrentUserId('USR-CUSTOMER');
    setIsAdminOpen(false);
    setCurrentView('home');
    showToast('সেশন থেকে লগআউট সম্পন্ন হয়েছে।', 'info');
  };

  // Register New Seller
  const handleRegisterSeller = (sellerData: Partial<Developer>, password?: string) => {
    const newDevId = Date.now();
    const newDev: Developer = {
      id: newDevId,
      name: sellerData.name || 'নতুন সেলার',
      username: sellerData.username,
      service: sellerData.service || 'প্রাইভেট লাইভ সেশন',
      category: sellerData.category || 'app',
      price: sellerData.price || 100,
      rating: 5.0,
      completedOrders: 0,
      avatarSeed: sellerData.name || 'Seller',
      avatar: sellerData.avatar,
      bio: sellerData.bio || 'দক্ষ সেলার সার্ভিস।',
      skills: sellerData.skills || ['লাইভ সেশন', 'প্রাইভেট চ্যাট'],
      online: true,
      deliveryTime: 'ইনস্ট্যান্ট কানেক্ট',
      purchasedTime: 0,
      phone: sellerData.phone,
      password: password || sellerData.phone,
      telegram: sellerData.telegram,
      isTimeSaleActive: true,
      maxAvailableHours: 10,
      bookedHours: 0,
      diamondPerHour: sellerData.price || 100,
    };

    setDevelopers((prev) => [newDev, ...prev]);

    // Create matching User Account
    const newUserId = `USR-SELLER-${newDevId}`;
    const newUserAcc: UserAccount = {
      id: newUserId,
      name: newDev.name,
      username: newDev.username,
      phone: newDev.phone || '',
      password: newDev.password,
      diamonds: 1000,
      bio: newDev.bio,
      isBanned: false,
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'seller',
      sellerId: newDevId,
      avatar: newDev.avatar,
    };

    setUsers((prev) => [newUserAcc, ...prev]);
    setCurrentUserId(newUserId);
    showToast(`নতুন সেলার শপ সফলভাবে তৈরি হয়েছে: ${newDev.name}!`, 'success');
    setCurrentView('seller_portal');
  };

  // Update active seller profile from SellerPortal
  const handleUpdateActiveSellerProfile = (updated: Partial<Developer>) => {
    const activeSellerId = userSession?.sellerId || developers[0]?.id;
    if (!activeSellerId) return;

    setDevelopers((prev) =>
      prev.map((d) => (d.id === activeSellerId ? { ...d, ...updated } : d))
    );

    if (updated.name || updated.avatar) {
      setUsers((prev) =>
        prev.map((u) =>
          u.sellerId === activeSellerId
            ? {
                ...u,
                ...(updated.name ? { name: updated.name } : {}),
                ...(updated.avatar ? { avatar: updated.avatar } : {}),
              }
            : u
        )
      );
    }
    showToast('আপনার সেলার শপ প্রোফাইল সফলভাবে আপডেট হয়েছে!', 'success');
  };

  // Find active seller for seller portal
  const currentSellerDev =
    developers.find((d) => d.id === userSession?.sellerId || d.name.toLowerCase() === activeUser.name.toLowerCase()) ||
    developers[0] ||
    INITIAL_DEVELOPERS[0];

  const pendingPaymentsCount = paymentRequests.filter((r) => r.status === 'pending').length;
  const activeOrdersCount = orders.filter((o) => o.status === 'in_progress' || o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main app container */}
      <div className={`w-full ${currentView === 'admin' ? 'max-w-5xl' : 'max-w-lg'} bg-slate-950 flex flex-col min-h-screen relative shadow-2xl border-x border-slate-800/60 transition-all duration-300`}>
        {/* If in Dedicated Admin Panel View */}
        {currentView === 'admin' ? (
          isOwner ? (
            <MasterAdminPanel
              isStandaloneView={true}
              onBackToSite={() => setCurrentView('home')}
              paymentRequests={paymentRequests}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              withdrawRequests={withdrawRequests}
              onApproveWithdraw={handleApproveWithdraw}
              onRejectWithdraw={handleRejectWithdraw}
              developers={developers}
              onAddDeveloper={handleAddDeveloper}
              onUpdateDeveloper={handleUpdateDeveloper}
              onDeleteDeveloper={handleDeleteDeveloper}
              paymentSettings={paymentSettings}
              onUpdateSettings={(newSettings) => {
                setPaymentSettings(newSettings);
                showToast('পেমেন্ট ও সাপোর্ট সেটিংস সংরক্ষিত হয়েছে!', 'success');
              }}
              siteConfig={siteConfig}
              onUpdateSiteConfig={(newConfig) => {
                setSiteConfig(newConfig);
                showToast('ওয়েবসাইট কনফিগারেশন সংরক্ষিত হয়েছে!', 'success');
              }}
              users={users}
              onUpdateUser={handleUpdateUser}
              onAddUser={handleAddUser}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRefundOrder={handleRefundOrder}
              botReplies={botReplies}
              onAddBotReply={handleAddBotReply}
              onToggleBotReply={handleToggleBotReply}
              onDeleteBotReply={handleDeleteBotReply}
              userDiamonds={diamonds}
              onAddDiamondsDirectly={handleAddDiamondsDirectly}
              onImpersonateUser={handleImpersonateUser}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="p-6 text-center space-y-4 my-auto">
              <p className="text-sm font-bold text-rose-400">
                ⚠️ অ্যাক্সেস ডিনাইড! শুধুমাত্র ওনার ডাটাবেজ এক্সেস করতে পারবেন।
              </p>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 rounded-xl text-white font-bold text-xs"
              >
                ওনার লগইন করুন
              </button>
            </div>
          )
        ) : (
          <>
            {/* Top bar */}
            <TopBar
              currentView={currentView}
              title={getHeaderTitle()}
              diamonds={diamonds}
              onDiamondClick={() => setCurrentView('profile')}
              onAdminClick={() => {
                if (isOwner) {
                  setIsAdminOpen(true);
                } else {
                  showToast('শুধুমাত্র ওনার (USP labon) এই প্যানেলে প্রবেশ করতে পারবেন।', 'error');
                  setIsLoginModalOpen(true);
                }
              }}
              onSellerPortalClick={() => setCurrentView('seller_portal')}
              pendingCount={pendingPaymentsCount}
              siteName={siteConfig.siteName}
              activeUser={activeUser}
              isOwner={isOwner}
              isSeller={isSeller}
            />

            {/* Dynamic Main View */}
            <main className="flex-1 p-3.5 sm:p-4 overflow-y-auto">
              {currentView === 'home' && (
                <HomeView
                  developers={developers}
                  allUsers={users}
                  onStartChatWithDev={(dev) => {
                    setActiveDevForChat(dev);
                    setCurrentView('chat');
                  }}
                  onHireDeveloper={(dev) => setSelectedDevForHire(dev)}
                  onOpenRecharge={() => setCurrentView('profile')}
                  siteConfig={siteConfig}
                  userDiamonds={diamonds}
                  onBookSlot={handleBookSlot}
                  onUpdateHostSettings={handleUpdateHostSettings}
                  isOwner={isOwner}
                  isSeller={isSeller}
                />
              )}

              {currentView === 'chat' && (
                <ChatView
                  messages={chatMessages}
                  orders={orders}
                  onSendMessage={handleSendMessage}
                  activeDeveloper={activeDevForChat}
                  onClearActiveDeveloper={() => setActiveDevForChat(null)}
                  allDevelopers={developers}
                  onSelectDeveloper={(dev) => setActiveDevForChat(dev)}
                  onHireDeveloper={(dev) => setSelectedDevForHire(dev)}
                  telegramSupportUrl={paymentSettings.telegramSupportUrl}
                  isAdmin={isOwner}
                />
              )}

              {currentView === 'orders' && (
                <OrdersView
                  orders={
                    isOwner
                      ? orders
                      : orders.filter((o) => o.userId === activeUser.id || !o.userId)
                  }
                  allUsers={users}
                  activeUser={activeUser}
                  onOpenChatWithDev={(devId) => {
                    const dev = developers.find((d) => d.id === devId) || null;
                    setActiveDevForChat(dev);
                    setCurrentView('chat');
                  }}
                  onCompleteOrder={handleCompleteOrderByUser}
                  onDeleteOrder={handleDeleteOrderByUser}
                  onExploreServices={() => setCurrentView('home')}
                />
              )}

              {currentView === 'profile' && (
                <ProfileView
                  currentUser={activeUser}
                  allUsers={users}
                  onSwitchUser={(newId) => {
                    setCurrentUserId(newId);
                    const targetName = users.find((u) => u.id === newId)?.name || newId;
                    showToast(`সক্রিয় প্রোফাইল পরিবর্তন: ${targetName}`, 'info');
                  }}
                  onUpdateUserName={(targetId, name, phone) => {
                    handleUpdateUser(targetId, { name, phone });
                  }}
                  onUpdateBio={handleUpdateBio}
                  onRegisterUser={handleRegisterNewUser}
                  diamonds={diamonds}
                  paymentRequests={paymentRequests}
                  paymentSettings={paymentSettings}
                  onSubmitPayment={handleSubmitPayment}
                  onOpenAdmin={() => {
                    if (isOwner) {
                      setIsAdminOpen(true);
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  onOpenSellerPortal={() => setCurrentView('seller_portal')}
                  onOpenLoginModal={() => setIsLoginModalOpen(true)}
                  onCopyText={handleCopyText}
                  currentSession={userSession}
                  onLoginSession={handleLoginSession}
                  onLogoutSession={handleLogoutSession}
                  isOwner={isOwner}
                  isSeller={isSeller}
                />
              )}

              {currentView === 'seller_portal' && (
                <SellerPortal
                  seller={currentSellerDev}
                  sellerAccount={activeUser}
                  orders={orders}
                  chatMessages={chatMessages}
                  withdrawRequests={withdrawRequests}
                  onRequestWithdraw={handleRequestWithdraw}
                  onUpdateSellerProfile={handleUpdateActiveSellerProfile}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onSendMessage={handleSendMessage}
                  onBackToMarketplace={() => setCurrentView('home')}
                />
              )}
            </main>

            {/* Hire Confirmation Modal */}
            {selectedDevForHire && (
              <HireModal
                developer={selectedDevForHire}
                userDiamonds={diamonds}
                onClose={() => setSelectedDevForHire(null)}
                onConfirmHire={handleConfirmHire}
                onGoToRecharge={() => {
                  setSelectedDevForHire(null);
                  setCurrentView('profile');
                }}
              />
            )}

            {/* Login / Seller Registration Modal */}
            {isLoginModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="relative w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold border border-slate-700 shadow-lg cursor-pointer z-10"
                  >
                    ✕
                  </button>
                  <LoginVerification
                    currentSession={userSession}
                    allDevelopers={developers}
                    allUsers={users}
                    onLoginSuccess={(session) => {
                      handleLoginSession(session);
                      setIsLoginModalOpen(false);
                    }}
                    onRegisterSeller={handleRegisterSeller}
                    onRegisterCustomer={(name, phone, password) =>
                      handleRegisterNewUser(name, `@${name.toLowerCase().replace(/\s+/g, '_')}`, phone, password)
                    }
                    onLogout={handleLogoutSession}
                    onClose={() => setIsLoginModalOpen(false)}
                    isModal={true}
                  />
                </div>
              </div>
            )}

            {/* Admin Control Center Modal (OWNER ONLY) */}
            {isAdminOpen && isOwner && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md">
                <MasterAdminPanel
                  onBackToSite={() => setIsAdminOpen(false)}
                  paymentRequests={paymentRequests}
                  onApprovePayment={handleApprovePayment}
                  onRejectPayment={handleRejectPayment}
                  withdrawRequests={withdrawRequests}
                  onApproveWithdraw={handleApproveWithdraw}
                  onRejectWithdraw={handleRejectWithdraw}
                  developers={developers}
                  onAddDeveloper={handleAddDeveloper}
                  onUpdateDeveloper={handleUpdateDeveloper}
                  onDeleteDeveloper={handleDeleteDeveloper}
                  paymentSettings={paymentSettings}
                  onUpdateSettings={(newSettings) => {
                    setPaymentSettings(newSettings);
                    showToast('পেমেন্ট ও সাপোর্ট সেটিংস সংরক্ষিত হয়েছে!', 'success');
                  }}
                  siteConfig={siteConfig}
                  onUpdateSiteConfig={(newConfig) => {
                    setSiteConfig(newConfig);
                    showToast('ওয়েবসাইট কনফিগারেশন সংরক্ষিত হয়েছে!', 'success');
                  }}
                  users={users}
                  onUpdateUser={handleUpdateUser}
                  onAddUser={handleAddUser}
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onRefundOrder={handleRefundOrder}
                  botReplies={botReplies}
                  onAddBotReply={handleAddBotReply}
                  onToggleBotReply={handleToggleBotReply}
                  onDeleteBotReply={handleDeleteBotReply}
                  userDiamonds={diamonds}
                  onAddDiamondsDirectly={handleAddDiamondsDirectly}
                  onImpersonateUser={handleImpersonateUser}
                  chatMessages={chatMessages}
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}

            {/* Bottom Navigation */}
            <BottomNav
              currentView={currentView}
              onSelectView={(view) => {
                if (view === 'admin') {
                  if (isOwner) {
                    setCurrentView('admin');
                  } else {
                    showToast('শুধুমাত্র ওনার (USP labon) ডাটাবেজ প্যানেল এক্সেস করতে পারেন।', 'error');
                    setIsLoginModalOpen(true);
                  }
                } else if (view === 'seller_portal') {
                  setCurrentView('seller_portal');
                } else {
                  setCurrentView(view);
                }
              }}
              activeOrdersCount={activeOrdersCount}
              pendingRequestsCount={pendingPaymentsCount}
              userRole={userSession?.role || activeUser.role || 'user'}
              isOwner={isOwner}
            />

            {/* Entrance Welcome / Promo Popup Banner */}
            <EntrancePopupBanner
              siteConfig={siteConfig}
              onNavigateToRecharge={() => {
                setCurrentView('profile');
                showToast('ডায়মন্ড রিচার্জ অপশনে নিয়ে যাওয়া হচ্ছে...', 'info');
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
