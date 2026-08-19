import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Gem,
  Lock,
  Plus,
  Settings,
  ShoppingBag,
  Users,
  Phone,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Trash2,
  Edit3,
  Search,
  Bell,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Sliders,
  AlertTriangle,
  UserCheck,
  UserX,
  Send,
  Eye,
  Key,
  Globe,
  Radio,
  Check,
  X,
  ChevronRight,
  Activity,
  User as UserIcon,
  Clock,
  History,
  MessageCircle,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Layers,
  HelpCircle,
  FileImage,
  Store,
  UserPlus,
  User,
  Percent,
  Zap,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Developer,
  PaymentMethod,
  PaymentRequest,
  PaymentSettings as PaymentSettingsType,
  ServiceOrder,
  SiteConfig,
  UserAccount,
  BotAutoReply,
  ChatMessage,
  SellerWithdrawRequest,
  MarketingBanner
} from '../types';
import { sounds } from '../utils/sound';
import { checkAdminAuth } from '../utils/auth';
import { PaymentSettings } from './PaymentSettings';

interface MasterAdminPanelProps {
  onBackToSite?: () => void;
  isStandaloneView?: boolean;
  paymentRequests: PaymentRequest[];
  onApprovePayment: (requestId: string, customAmount?: number) => void;
  onRejectPayment: (requestId: string) => void;
  withdrawRequests?: SellerWithdrawRequest[];
  onApproveWithdraw?: (requestId: string, adminTrxId?: string, note?: string) => void;
  onRejectWithdraw?: (requestId: string, note?: string) => void;
  developers: Developer[];
  onAddDeveloper: (dev: Omit<Developer, 'id' | 'rating' | 'completedOrders' | 'online'>) => void;
  onUpdateDeveloper: (id: number, updated: Partial<Developer>) => void;
  onDeleteDeveloper: (devId: number) => void;
  paymentSettings: PaymentSettingsType;
  onUpdateSettings: (settings: PaymentSettingsType) => void;
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (config: SiteConfig) => void;
  users: UserAccount[];
  onUpdateUser: (userId: string, updated: Partial<UserAccount>) => void;
  onAddUser: (user: UserAccount) => void;
  orders: ServiceOrder[];
  onUpdateOrderStatus: (orderId: string, status: ServiceOrder['status'], adminNote?: string) => void;
  onRefundOrder?: (orderId: string) => void;
  botReplies: BotAutoReply[];
  onAddBotReply: (reply: Omit<BotAutoReply, 'id'>) => void;
  onToggleBotReply: (id: string) => void;
  onDeleteBotReply: (id: string) => void;
  userDiamonds: number;
  onAddDiamondsDirectly: (amount: number, targetUserId?: string) => void;
  onImpersonateUser?: (target: UserAccount | Developer) => void;
  chatMessages?: ChatMessage[];
  onSendMessage?: (
    text: string,
    developerId?: number,
    attachment?: ChatMessage['attachment'],
    senderOverride?: 'user' | 'bot' | 'developer' | 'admin'
  ) => void;
}

export const MasterAdminPanel: React.FC<MasterAdminPanelProps> = ({
  onBackToSite,
  isStandaloneView = false,
  paymentRequests,
  onApprovePayment,
  onRejectPayment,
  withdrawRequests = [],
  onApproveWithdraw,
  onRejectWithdraw,
  developers,
  onAddDeveloper,
  onUpdateDeveloper,
  onDeleteDeveloper,
  paymentSettings,
  onUpdateSettings,
  siteConfig,
  onUpdateSiteConfig,
  users,
  onUpdateUser,
  onAddUser,
  orders,
  onUpdateOrderStatus,
  onRefundOrder,
  botReplies,
  onAddBotReply,
  onToggleBotReply,
  onDeleteBotReply,
  userDiamonds,
  onAddDiamondsDirectly,
  onImpersonateUser,
  chatMessages = [],
  onSendMessage,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');
  
  type AdminTab =
    | 'overview'
    | 'users'
    | 'payments'
    | 'withdrawals'
    | 'services'
    | 'orders'
    | 'livechat'
    | 'broadcast'
    | 'bot'
    | 'settings'
    | 'history';
  const [activeTab, setActiveTab] = useState<AdminTab>('services');
  const [userSearchText, setUserSearchText] = useState('');

  // Live Admin Chat state
  const [selectedChatDevId, setSelectedChatDevId] = useState<number | undefined>(undefined);
  const [adminChatText, setAdminChatText] = useState('');
  const [adminChatAsHost, setAdminChatAsHost] = useState(false);

  // Manual diamond input tracking per request ID
  const [customDiamondInputs, setCustomDiamondInputs] = useState<Record<string, string>>({});

  // Direct Gift state
  const [giftAmount, setGiftAmount] = useState<string>('500');
  const [targetUserId, setTargetUserId] = useState<string>(() => users[0]?.id || 'USR-ALEX');

  // Omnipotent Seller / Developer Control & Message Inspector states
  const [inspectedDev, setInspectedDev] = useState<Developer | null>(null);
  const [sellerSearchText, setSellerSearchText] = useState('');
  const [inspectorReplyText, setInspectorReplyText] = useState('');

  // Search filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [copiedWithdrawId, setCopiedWithdrawId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');

  // New developer / seller state
  const [isAddingDev, setIsAddingDev] = useState(false);
  const [devName, setDevName] = useState('');
  const [devUsername, setDevUsername] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [devPhone, setDevPhone] = useState('');
  const [devAvatar, setDevAvatar] = useState('');
  const [devService, setDevService] = useState('');
  const [devCategory, setDevCategory] = useState<Developer['category']>('app');
  const [devPrice, setDevPrice] = useState('100');
  const [devDeliveryTime, setDevDeliveryTime] = useState('তাৎক্ষণিক লাইভ');
  const [devSkills, setDevSkills] = useState('Voice Chat, Live Host, Gaming');
  const [devBio, setDevBio] = useState('ভেরিফায়েড প্রফেশনাল সেলার ও লাইভ হোস্ট।');
  const [devTelegram, setDevTelegram] = useState('');

  const handleSellerAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('ছবির সাইজ ৩MB এর কম হতে হবে!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setDevAvatar(res);
        sounds.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  // Edit developer modal
  const [editingDev, setEditingDev] = useState<Developer | null>(null);

  // Settings & Config state
  const [editableSettings, setEditableSettings] = useState<PaymentSettingsType>(paymentSettings);
  const [editableConfig, setEditableConfig] = useState<SiteConfig>(siteConfig);
  const [newPin, setNewPin] = useState('');
  const [newPinSuccess, setNewPinSuccess] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  // Multi-Banner Manager States
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerButtonText, setNewBannerButtonText] = useState('এখনই দেখুন');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [isAddingNewBanner, setIsAddingNewBanner] = useState(false);

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ ৫MB এর কম হতে হবে!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setEditableConfig((prev) => ({
          ...prev,
          popupBannerImage: result,
          showPopupBanner: true,
        }));
        sounds.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ ৫MB এর কম হতে হবে!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setNewBannerImage(result);
        sounds.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBannerToList = () => {
    if (!newBannerImage.trim()) {
      alert('অনুগ্রহ করে ব্যানারের একটি ছবি আপলোড করুন বা লিংক দিন!');
      return;
    }
    const newBanner: MarketingBanner = {
      id: `banner-${Date.now()}`,
      image: newBannerImage.trim(),
      title: newBannerTitle.trim() || '🎉 বিশেষ অফার ও ঘোষণা!',
      subtitle: newBannerSubtitle.trim() || '',
      buttonText: newBannerButtonText.trim() || 'এখনই দেখুন',
      link: newBannerLink.trim() || '',
      active: true,
    };
    const currentList = editableConfig.popupBanners || [];
    const updatedBanners = [...currentList, newBanner];
    const updatedConfig: SiteConfig = {
      ...editableConfig,
      popupBanners: updatedBanners,
      showPopupBanner: true,
      popupBannerImage: updatedBanners[0]?.image || newBanner.image,
    };
    setEditableConfig(updatedConfig);
    onUpdateSiteConfig(updatedConfig);
    setNewBannerImage('');
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerButtonText('এখনই দেখুন');
    setNewBannerLink('');
    setIsAddingNewBanner(false);
    sounds.playSuccess();
    triggerConfetti();
    alert('✅ নতুন ব্যানার সফলভাবে তালিকায় যোগ করা হয়েছে!');
  };

  const handleDeleteBannerItem = (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ব্যানারটি ডিলিট করতে চান?')) return;
    const currentList = editableConfig.popupBanners || [];
    const updatedBanners = currentList.filter((b) => b.id !== id);
    const updatedConfig: SiteConfig = {
      ...editableConfig,
      popupBanners: updatedBanners,
      popupBannerImage: updatedBanners[0]?.image || '',
      showPopupBanner: updatedBanners.length > 0 ? editableConfig.showPopupBanner : false,
    };
    setEditableConfig(updatedConfig);
    onUpdateSiteConfig(updatedConfig);
    sounds.playClick();
    alert('ব্যানারটি মুছে ফেলা হয়েছে।');
  };

  const handleToggleBannerItem = (id: string) => {
    const currentList = editableConfig.popupBanners || [];
    const updatedBanners = currentList.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    const updatedConfig: SiteConfig = {
      ...editableConfig,
      popupBanners: updatedBanners,
    };
    setEditableConfig(updatedConfig);
    onUpdateSiteConfig(updatedConfig);
    sounds.playClick();
  };

  // New bot reply trigger
  const [newBotTrigger, setNewBotTrigger] = useState('');
  const [newBotResponse, setNewBotResponse] = useState('');

  // New user state
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminAuth(adminEmail, adminPass) || (adminEmail.trim() === '' && adminPass === siteConfig.adminPin)) {
      setIsAuthenticated(true);
      setAuthError('');
      sounds.playSuccess();
    } else {
      setAuthError('ভুল ইমেইল বা পাসওয়ার্ড! অনুগ্রহ করে সঠিক সিক্রেট অ্যাডমিন ক্রেডেনশিয়াল ব্যবহার করুন।');
      sounds.playError();
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleApproveWithCustomDiamonds = (req: PaymentRequest) => {
    const rawVal = customDiamondInputs[req.id];
    const diamondAmount = rawVal ? parseInt(rawVal) : req.amountDiamonds;
    
    if (isNaN(diamondAmount) || diamondAmount <= 0) {
      alert('সঠিক ডায়মন্ডের পরিমাণ লিখুন!');
      return;
    }

    onApprovePayment(req.id, diamondAmount);
    sounds.playSuccess();
    triggerConfetti();
  };

  const handleReject = (reqId: string) => {
    onRejectPayment(reqId);
    sounds.playCancel();
  };

  const handleCreateDev = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim() || !devService.trim()) {
      alert('সেলার নাম ও সার্ভিসের শিরোনাম লিখুন!');
      return;
    }

    const cleanUsername = devUsername.trim()
      ? (devUsername.trim().startsWith('@') ? devUsername.trim() : `@${devUsername.trim()}`)
      : `@${devName.trim().toLowerCase().replace(/\s+/g, '_')}`;

    onAddDeveloper({
      name: devName.trim(),
      username: cleanUsername,
      password: devPassword.trim() || '1234',
      phone: devPhone.trim() || '01700-000000',
      service: devService.trim(),
      category: devCategory,
      price: parseInt(devPrice) || 100,
      diamondPerHour: parseInt(devPrice) || 100,
      avatar: devAvatar || undefined,
      avatarSeed: `Seller_${Date.now()}`,
      bio: devBio.trim() || 'ভেরিফায়েড প্রফেশনাল সেলার ও হোস্ট।',
      skills: devSkills.split(',').map((s) => s.trim()).filter(Boolean),
      deliveryTime: devDeliveryTime.trim() || 'তাৎক্ষণিক লাইভ',
      telegram: devTelegram.trim(),
      online: true,
      rating: 5.0,
      completedOrders: 0,
    });

    setDevName('');
    setDevUsername('');
    setDevPassword('');
    setDevPhone('');
    setDevAvatar('');
    setDevService('');
    setIsAddingDev(false);
    sounds.playSuccess();
    triggerConfetti();
  };

  const handleSaveDevEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDev) return;
    onUpdateDeveloper(editingDev.id, editingDev);
    setEditingDev(null);
    sounds.playSuccess();
  };

  const handleAddBotReplyRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotTrigger.trim() || !newBotResponse.trim()) return;
    onAddBotReply({
      trigger: newBotTrigger.trim(),
      response: newBotResponse.trim(),
      enabled: true
    });
    setNewBotTrigger('');
    setNewBotResponse('');
    sounds.playSuccess();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const generatedId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    onAddUser({
      id: generatedId,
      name: newUserName.trim(),
      phone: newUserPhone.trim() || '01700-000000',
      diamonds: 0,
      isBanned: false,
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'user'
    });
    setNewUserName('');
    setNewUserPhone('');
    sounds.playSuccess();
  };

  // Calculations for Overview Dashboard & Withdrawals
  const pendingRequests = paymentRequests.filter((r) => r.status === 'pending');
  const approvedRequests = paymentRequests.filter((r) => r.status === 'approved');
  const totalBdtRevenue = approvedRequests.reduce((sum, r) => sum + r.bdtAmount, 0);
  const totalDiamondsApproved = approvedRequests.reduce((sum, r) => sum + r.amountDiamonds, 0);

  const pendingWithdrawals = withdrawRequests.filter((r) => r.status === 'pending');
  const approvedWithdrawals = withdrawRequests.filter((r) => r.status === 'approved');
  const totalWithdrawnBdt = approvedWithdrawals.reduce((sum, r) => sum + r.bdtAmount, 0);
  const totalWithdrawnDiamonds = approvedWithdrawals.reduce((sum, r) => sum + r.amountDiamonds, 0);

  const activeOrders = orders.filter((o) => o.status === 'in_progress' || o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  // Copy helper
  const handleCopyAccount = (num: string, id: string) => {
    try {
      navigator.clipboard.writeText(num);
      setCopiedWithdrawId(id);
      sounds.playSuccess();
      setTimeout(() => setCopiedWithdrawId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Withdraw handlers - 1-click confirm when owner sends money
  const handleApproveWithdraw = (req: SellerWithdrawRequest) => {
    if (onApproveWithdraw) {
      onApproveWithdraw(req.id, undefined, undefined);
      sounds.playSuccess();
      triggerConfetti();
    }
  };

  const handleRejectWithdraw = (req: SellerWithdrawRequest) => {
    if (onRejectWithdraw) {
      onRejectWithdraw(req.id, 'ওনার কর্তৃক বাতিল ও রিফান্ড করা হয়েছে');
      sounds.playCancel();
    }
  };

  // Filtered lists
  const filteredWithdrawRequests = withdrawRequests.filter((r) => {
    if (withdrawFilter !== 'all' && r.status !== withdrawFilter) return false;
    if (!searchQuery) return true;
    return (
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sellerPhone.includes(searchQuery) ||
      r.accountNumber.includes(searchQuery) ||
      r.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredPaymentRequests = paymentRequests.filter((r) => {
    if (paymentFilter !== 'all' && r.status !== paymentFilter) return false;
    if (!searchQuery) return true;
    return (
      r.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.senderPhone.includes(searchQuery) ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (!searchQuery) return true;
    return (
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.developerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-rose-900/40 px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide">সিক্রেট অ্যাডমিন প্যানেল</h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold uppercase tracking-wider">
                USP LABON ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400">পেমেন্ট ভেরিফিকেশন, ম্যানুয়াল ডায়মন্ড সেন্ড ও সিস্টেম কন্ট্রোল</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>ওয়েবসাইটে ফিরুন</span>
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={() => {
                setIsAuthenticated(false);
                sounds.playCancel();
              }}
              title="লগআউট"
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {!isAuthenticated ? (
        /* Secret Admin Auth Screen */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-100">মাস্টার ওনার ভেরিফিকেশন</h2>
              <p className="text-xs text-slate-400 mt-1">
                অ্যাডমিন ডাটাবেজ ও ফুল কন্ট্রোল আনলক করতে সিক্রেট পিন বা পাসওয়ার্ড দিন
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">অ্যাডমিন ইউজারনেম / ইমেইল:</label>
                <input
                  type="text"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="যেমন: USP labon বা ইমেইল"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-rose-500 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">সিক্রেট অ্যাডমিন পিন / পাসওয়ার্ড:</label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="৪-ডিজিট পিন বা পাসওয়ার্ড"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 tracking-wider focus:outline-none focus:border-rose-500 shadow-inner"
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-400 font-medium bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
                  {authError}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>প্যানেলে প্রবেশ করুন</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : (
        /* Authenticated Master Dashboard */
        <div className="flex-1 flex flex-col overflow-hidden pb-12">
          {/* Navigation Bar for All Modules */}
          <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
            {[
              { id: 'users', label: '👥 কাস্টমার ডাটাবেজ', badge: users.length },
              { id: 'services', label: '🛍️ সেলার তৈরি ও চ্যাট এক্সেস', badge: developers.length },
              { id: 'payments', label: '💎 রিচার্জ পেমেন্ট', badge: pendingRequests.length },
              { id: 'withdrawals', label: '💸 সেলার উইথড্র রিকোয়েস্ট', badge: pendingWithdrawals.length },
              { id: 'orders', label: '📦 অর্ডার কন্ট্রোল ও হিস্ট্রি', badge: activeOrders.length },
              { id: 'livechat', label: '💬 সার্বিক লাইভ চ্যাট', badge: chatMessages.length },
              { id: 'settings', label: '⚙️ পেমেন্ট গেটওয়ে ও ব্যানার' },
              { id: 'broadcast', label: '📢 নোটিশ ও স্ক্রোলিং' },
              { id: 'bot', label: '🤖 অটো-রিপ্লাই বট' },
              { id: 'overview', label: '📊 ওভারভিউ' },
              { id: 'history', label: '📜 সেন্ডিং হিস্ট্রি' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  sounds.playReceive();
                }}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="px-1.5 py-0.2 bg-white text-rose-600 rounded-full text-[10px] font-black">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Module Content Container */}
          <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full space-y-4">
            
            {/* 0. REGISTERED USERS & CUSTOMER DATABASE TABLE TAB */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Header & Stats Banner */}
                <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/40 rounded-3xl p-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-black text-white">
                          👥 নিবন্ধিত গ্রাহক ও কাস্টমার ডাটাবেজ টেবিল
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        ওয়েবসাইটে সাইন আপ করা সকল ক্রেতা ও ইউজারের তথ্য, মোবাইল নম্বর, পাসওয়ার্ড এবং ডায়মন্ড ব্যালেন্স লাইভ ডাটাবেজ।
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyan-300 font-bold bg-cyan-950/90 px-3 py-1.5 rounded-xl border border-cyan-500/40 font-mono">
                        সর্বমোট অ্যাকাউন্ট: {users.length} টি
                      </span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchText}
                        onChange={(e) => setUserSearchText(e.target.value)}
                        placeholder="গ্রাহকের নাম, ইউজার আইডি (USR-...), মোবাইল নম্বর দিয়ে খুঁজুন..."
                        className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick User Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
                    <div className="text-xs font-bold text-cyan-400 uppercase">👤 মোট গ্রাহক (Customers)</div>
                    <div className="text-2xl font-black text-white mt-1">
                      {users.filter((u) => u.role === 'user' || !u.role || u.role === 'vip').length}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">সাইন আপ করা সাধারণ ক্রেতা</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
                    <div className="text-xs font-bold text-amber-400 uppercase">🛍️ সেলার / হোস্ট (Sellers)</div>
                    <div className="text-2xl font-black text-amber-300 mt-1">
                      {users.filter((u) => u.role === 'seller').length || developers.length}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">সার্ভিস প্রদানকারী সেলার</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
                    <div className="text-xs font-bold text-rose-400 uppercase">👑 সিস্টেম ওনার (Owner)</div>
                    <div className="text-2xl font-black text-rose-300 mt-1">1</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">মাস্টার অ্যাডমিন কন্ট্রোলার</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
                    <div className="text-xs font-bold text-emerald-400 uppercase">💎 মোট ডায়মন্ড ভলিউম</div>
                    <div className="text-2xl font-black text-emerald-300 mt-1">
                      {users.reduce((acc, u) => acc + (u.diamonds || 0), 0).toLocaleString()} 💎
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">সকল ইউজারের ওয়ালেট ব্যালেন্স</p>
                  </div>
                </div>

                {/* Users Database Table List */}
                <div className="space-y-3">
                  {users
                    .filter((u) => {
                      if (!userSearchText.trim()) return true;
                      const q = userSearchText.toLowerCase().trim();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.id.toLowerCase().includes(q) ||
                        (u.phone && u.phone.includes(q)) ||
                        (u.username && u.username.toLowerCase().includes(q))
                      );
                    })
                    .map((userItem) => (
                      <div
                        key={userItem.id}
                        className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 shadow-xl transition space-y-3"
                      >
                        {/* Row 1: Profile & Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <img
                              src={userItem.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userItem.name)}`}
                              alt={userItem.name}
                              className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/30 object-cover shadow"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-white">{userItem.name}</h4>
                                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                                  {userItem.id}
                                </span>
                                {userItem.role === 'owner' ? (
                                  <span className="text-[9px] bg-rose-500/20 text-rose-300 font-black px-2 py-0.5 rounded border border-rose-500/40">
                                    👑 ওনার
                                  </span>
                                ) : userItem.role === 'seller' ? (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded border border-amber-500/40">
                                    🛍️ সেলার
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                                    👤 কাস্টমার / ক্রেতা
                                  </span>
                                )}
                                {userItem.isBanned && (
                                  <span className="text-[9px] bg-rose-950 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-700">
                                    🚫 Banned
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                ইউজারনেম: <span className="text-slate-300 font-mono">{userItem.username || `@user_${userItem.id}`}</span> • যোগদান: {userItem.joinedDate || 'আজকে'}
                              </p>
                            </div>
                          </div>

                          {/* Diamonds Balance Pill */}
                          <div className="flex items-center gap-2 sm:justify-end">
                            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-amber-300 font-black text-xs flex items-center gap-1.5">
                              <span>💎</span>
                              <span className="font-mono text-sm">{(userItem.diamonds || 0).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 font-normal">ডায়মন্ড</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Credentials Grid & Database Fields */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">মোবাইল নম্বর:</span>
                            <span className="text-cyan-300 font-bold">{userItem.phone || 'অনির্ধারিত'}</span>
                          </div>

                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">লগইন পাসওয়ার্ড:</span>
                            <span className="text-amber-300 font-bold tracking-wider">
                              {userItem.password || '1234 (ডিফল্ট)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">একাউন্ট স্ট্যাটাস:</span>
                            <span className={`font-bold ${userItem.isBanned ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {userItem.isBanned ? 'সাময়িক স্থগিত (Banned)' : 'সক্রিয় ও ভেরিফাইড (Active)'}
                            </span>
                          </div>
                        </div>

                        {/* Row 3: Admin Quick Actions for this user */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          {/* Quick Diamond Gifting to this user */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 text-[11px]">ডায়মন্ড যোগ করুন:</span>
                            <button
                              type="button"
                              onClick={() => {
                                onAddDiamondsDirectly(50, userItem.id);
                                sounds.playDiamond();
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              +৫০ 💎
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddDiamondsDirectly(100, userItem.id);
                                sounds.playDiamond();
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              +১০০ 💎
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddDiamondsDirectly(500, userItem.id);
                                sounds.playDiamond();
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              +৫০০ 💎
                            </button>
                          </div>

                          {/* Ban / Unban Toggle */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateUser(userItem.id, { isBanned: !userItem.isBanned });
                                sounds.playClick();
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                                userItem.isBanned
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900'
                              }`}
                            >
                              {userItem.isBanned ? 'আনব্যান করুন (Unban)' : 'ব্যান করুন (Ban)'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {users.length === 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                      <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold">এখনও কোনো কাস্টমার একাউন্ট ডাটাবেজে নেই।</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ব্যবহারকারীরা 'সাইন আপ' করলেই স্বয়ংক্রিয়ভাবে এই ডাটাবেজে যুক্ত হবে।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1. PAYMENTS & MANUAL DIAMOND RECHARGE APPROVAL TAB */}
            {activeTab === 'payments' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Header info */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Gem className="w-4 h-4 text-cyan-400" />
                      <span>💎 ডায়মন্ড ও পেমেন্ট রিকোয়েস্ট ম্যানেজমেন্ট</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      TxID মিলিয়ে দেখুন এবং হাতে ডায়মন্ডের পরিমাণ লিখে কনফার্ম করুন
                    </p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    {(['pending', 'all', 'approved', 'rejected'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setPaymentFilter(filter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                          paymentFilter === filter
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {filter === 'pending'
                          ? `পেন্ডিং (${pendingRequests.length})`
                          : filter === 'approved'
                          ? 'অনুমোদিত'
                          : filter === 'rejected'
                          ? 'বাতিল'
                          : 'সবগুলো'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ইউজার আইডি (User ID), নাম, TrxID বা ফোন নম্বর দিয়ে খুঁজুন..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Payment Requests List */}
                <div className="space-y-3.5">
                  {filteredPaymentRequests.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">কোনো রিচার্জ রিকোয়েস্ট পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-500 mt-1">ব্যবহারকারী রিচার্জ রিকোয়েস্ট পাঠালে এখানে দৃশ্যমান হবে।</p>
                    </div>
                  ) : (
                    filteredPaymentRequests.map((req) => {
                      const currentInputValue = customDiamondInputs[req.id] !== undefined
                        ? customDiamondInputs[req.id]
                        : String(req.amountDiamonds);

                      return (
                        <div
                          key={req.id}
                          className={`bg-slate-900 border rounded-2xl p-4 shadow-xl transition space-y-3.5 ${
                            req.status === 'pending'
                              ? 'border-amber-500/60 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20'
                              : req.status === 'approved'
                              ? 'border-emerald-500/30'
                              : 'border-slate-800 opacity-60'
                          }`}
                        >
                          {/* User ID & Package Details */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                    req.method === 'bKash'
                                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                                      : req.method === 'Nagad'
                                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                      : req.method === 'Rocket'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {req.method}
                                </span>
                                
                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{req.userName}</span>
                                </span>

                                <span className="text-[11px] text-cyan-300 font-mono font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                                  User ID: {req.userId}
                                </span>
                              </div>
                              
                              <p className="text-[11px] text-slate-400 mt-1">
                                আবেদনের তারিখ: <span className="font-mono text-slate-300">{req.date}</span>
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <div className="text-sm font-black text-cyan-300 flex items-center sm:justify-end gap-1">
                                <Gem className="w-4 h-4 text-cyan-400" />
                                <span>প্যাকেজ: {req.amountDiamonds} ডায়মন্ড</span>
                              </div>
                              <span className="text-xs font-bold text-emerald-400 font-mono">
                                ৳ {req.bdtAmount} BDT
                              </span>
                            </div>
                          </div>

                          {/* Transaction Verification Details */}
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">প্রেরক ফোন নম্বর:</span>
                              <span className="text-slate-200 font-bold">{req.senderPhone}</span>
                            </div>
                            
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Transaction ID (TxID):</span>
                              <span className="text-amber-300 font-black tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 inline-block mt-0.5">
                                {req.trxId}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">বর্তমান স্ট্যাটাস:</span>
                              <span
                                className={`font-bold inline-block mt-0.5 ${
                                  req.status === 'approved'
                                    ? 'text-emerald-400'
                                    : req.status === 'rejected'
                                    ? 'text-rose-400'
                                    : 'text-amber-400 animate-pulse'
                                }`}
                              >
                                {req.status === 'approved'
                                  ? '✅ অনুমোদিত (Completed)'
                                  : req.status === 'rejected'
                                  ? '❌ বাতিল (Rejected)'
                                  : '⏳ অপেক্ষমাণ (Pending Verification)'}
                              </span>
                            </div>
                          </div>

                          {/* Manual Diamond Input & Tick Confirmation */}
                          {req.status === 'pending' && (
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs font-bold text-cyan-300 whitespace-nowrap flex items-center gap-1">
                                  <Gem className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>ডায়মন্ডের পরিমাণ:</span>
                                </label>
                                <input
                                  type="number"
                                  value={currentInputValue}
                                  onChange={(e) =>
                                    setCustomDiamondInputs({
                                      ...customDiamondInputs,
                                      [req.id]: e.target.value
                                    })
                                  }
                                  placeholder="500"
                                  className="w-28 bg-slate-900 border border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                                />
                                <span className="text-[11px] text-slate-400">💎</span>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleReject(req.id)}
                                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>বাতিল</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApproveWithCustomDiamonds(req)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>কনফার্ম ও ডায়মন্ড সেন্ড (Tick)</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 1.1 SELLER WITHDRAWALS TAB */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-amber-400 mb-1">
                      <span className="text-xs font-bold uppercase">পেন্ডিং উইথড্র</span>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-amber-300">{pendingWithdrawals.length} টি</div>
                    <p className="text-[10px] text-slate-400 mt-1">ক্যাশআউট রিকোয়েস্ট জমা আছে</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-emerald-400 mb-1">
                      <span className="text-xs font-bold uppercase">মোট পেইড টাকা</span>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-emerald-300">
                      ৳ {totalWithdrawnBdt.toLocaleString()} BDT
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">সেলারদের পাঠানো হয়েছে</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-cyan-400 mb-1">
                      <span className="text-xs font-bold uppercase">ক্যাশআউট ডায়মন্ড</span>
                      <Gem className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-cyan-300">
                      {totalWithdrawnDiamonds.toLocaleString()} 💎
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">মোট বার্ন / কনভার্ট করা</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-indigo-400 mb-1">
                      <span className="text-xs font-bold uppercase">মোট আবেদন</span>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-indigo-300">{withdrawRequests.length} টি</div>
                    <p className="text-[10px] text-slate-400 mt-1">সর্বমোট উইথড্র হিস্ট্রি</p>
                  </div>
                </div>

                {/* Filter and Search Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
                    {(
                      [
                        { id: 'pending', label: '⏳ পেন্ডিং', count: pendingWithdrawals.length },
                        { id: 'approved', label: '✅ পেইড/অনুমোদিত', count: approvedWithdrawals.length },
                        { id: 'rejected', label: '❌ বাতিলকৃত', count: withdrawRequests.filter((r) => r.status === 'rejected').length },
                        { id: 'all', label: 'সকল রিকোয়েস্ট', count: withdrawRequests.length },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setWithdrawFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          withdrawFilter === f.id
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="সেলার নাম, ফোন বা বিকাশ নম্বর..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Withdrawal Requests List */}
                <div className="space-y-3">
                  {filteredWithdrawRequests.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs">কোনো উইথড্র রিকোয়েস্ট পাওয়া যায়নি।</p>
                    </div>
                  ) : (
                    filteredWithdrawRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg space-y-3 transition"
                      >
                          {/* Top Row: Seller Info & Requested Diamonds/BDT */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                    req.paymentMethod === 'bKash'
                                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                                      : req.paymentMethod === 'Nagad'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : req.paymentMethod === 'Rocket'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  }`}
                                >
                                  {req.paymentMethod} ({req.accountType || 'Personal'})
                                </span>

                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                  <Store className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{req.sellerName}</span>
                                </span>

                                <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                  ID: #{req.id}
                                </span>

                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    req.status === 'approved'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : req.status === 'rejected'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                  }`}
                                >
                                  {req.status === 'approved'
                                    ? '✅ পেমেন্ট সম্পন্ন'
                                    : req.status === 'rejected'
                                    ? '❌ বাতিলকৃত'
                                    : '⏳ পেন্ডিং পেমেন্ট'}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400">
                                আবেদনের সময়: <span className="font-mono text-slate-300">{req.requestedAt}</span>
                              </p>
                            </div>

                            {/* Amount in Diamond & BDT */}
                            <div className="text-left sm:text-right bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                              <div className="text-sm font-black text-amber-300 flex items-center sm:justify-end gap-1">
                                <Gem className="w-4 h-4 text-amber-400" />
                                <span>ক্যাশআউট: {req.amountDiamonds} ডায়মন্ড</span>
                              </div>
                              <span className="text-base font-black text-emerald-400 font-mono">
                                ৳ {req.bdtAmount} BDT
                              </span>
                            </div>
                          </div>

                          {/* Account & Details Box */}
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                                সেলারের ফোন নম্বর:
                              </span>
                              <span className="text-slate-200 font-mono font-bold">{req.sellerPhone}</span>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                                পেমেন্ট পাঠানোর একাউন্ট নম্বর:
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-amber-300 font-mono font-black tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                                  {req.accountNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAccount(req.accountNumber, req.id)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                                >
                                  {copiedWithdrawId === req.id ? '✅ কপি হয়েছে' : '📋 কপি'}
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                                সেলারের নোট:
                              </span>
                              <span className="text-slate-300 italic">
                                {req.note ? `"${req.note}"` : 'কোনো বিশেষ নোট নেই'}
                              </span>
                            </div>
                          </div>

                          {/* Approved / Rejected details if already processed */}
                          {req.status === 'approved' && (
                            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <span className="text-emerald-300 font-bold">✅ পেমেন্ট সফলভাবে পাঠানো হয়েছে (ভেরিফাইড)</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                প্রসেস সময়: {req.processedAt || 'সম্প্রতি'}
                              </span>
                            </div>
                          )}

                          {req.status === 'rejected' && (
                            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs flex items-center gap-2 text-rose-300">
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>উইথড্র বাতিল করা হয়েছে এবং সেলারের একাউন্টে ডায়মন্ড ফেরত দেওয়া হয়েছে।</span>
                            </div>
                          )}

                          {/* Admin Action Controls (If Pending - 1-Click Tick Confirmation) */}
                          {req.status === 'pending' && (
                            <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-amber-200">
                                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>
                                  {req.paymentMethod} নাম্বারে <strong>৳ {req.bdtAmount} টাকা</strong> পাঠিয়ে নিচের কনফার্ম বাটনে ক্লিক করুন:
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRejectWithdraw(req)}
                                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>বাতিল</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApproveWithdraw(req)}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>✅ টাকা পাঠানো হয়েছে (কনফার্ম / টিক দিন)</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* 2. OVERVIEW & ANALYTICS TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-amber-400 mb-1">
                      <span className="text-xs font-bold uppercase">পেন্ডিং রিচার্জ</span>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">{pendingRequests.length}</div>
                    <p className="text-[10px] text-slate-400 mt-1">অনুমোদনের অপেক্ষায়</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-emerald-400 mb-1">
                      <span className="text-xs font-bold uppercase">মোট রেভিনিউ</span>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-emerald-300">৳ {totalBdtRevenue.toLocaleString()}</div>
                    <p className="text-[10px] text-slate-400 mt-1">অনুমোদিত মোট টাকা</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-cyan-400 mb-1">
                      <span className="text-xs font-bold uppercase">ডায়মন্ড ইস্যু</span>
                      <Gem className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-cyan-300">{totalDiamondsApproved.toLocaleString()} 💎</div>
                    <p className="text-[10px] text-slate-400 mt-1">মোট ডিস্ট্রিবিউট করা</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-purple-400 mb-1">
                      <span className="text-xs font-bold uppercase">মোট সার্ভিস</span>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-purple-300">{developers.length}</div>
                    <p className="text-[10px] text-slate-400 mt-1">লাইভ হোস্ট ও সার্ভিস</p>
                  </div>
                </div>

                {/* Direct Diamond Gift Module */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    ম্যানুয়াল ডায়মন্ড ট্রান্সফার
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.id})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(e.target.value)}
                      placeholder="পরিমাণ"
                      className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none"
                    />

                    <button
                      onClick={() => {
                        const val = parseInt(giftAmount) || 0;
                        if (val > 0) {
                          onAddDiamondsDirectly(val, targetUserId);
                          sounds.playDiamond();
                          triggerConfetti();
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      +{giftAmount} 💎 পাঠান
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ORDERS CONTROL & HISTORY TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-1.5">
                    {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setOrderFilter(filter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                          orderFilter === filter
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {filter === 'all'
                          ? `সবগুলো (${orders.length})`
                          : filter === 'pending'
                          ? 'পেন্ডিং'
                          : filter === 'in_progress'
                          ? 'চলমান'
                          : filter === 'completed'
                          ? 'সম্পন্ন'
                          : 'বাতিল'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold">কোনো অর্ডার পাওয়া যায়নি</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                                #{order.id}
                              </span>
                              <h4 className="text-sm font-bold text-white">{order.serviceName}</h4>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              হোস্ট: {order.developerName} • তারিখ: {order.createdAt}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-cyan-300 block">
                              {order.priceDiamonds} 💎
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                order.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : order.status === 'in_progress'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                          <span className="text-slate-400">স্ট্যাটাস আপডেট করুন:</span>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(order.id, e.target.value as ServiceOrder['status'])
                            }
                            className="bg-slate-950 border border-slate-700 text-xs font-bold rounded-xl px-3 py-1 text-cyan-300 focus:outline-none"
                          >
                            <option value="pending">🟡 পেন্ডিং</option>
                            <option value="in_progress">🔵 কাজ চলছে</option>
                            <option value="completed">🟢 সম্পন্ন (Completed)</option>
                            <option value="cancelled">🔴 বাতিল (Cancelled)</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. SELLER CREATION, MANAGEMENT & LIVE MESSAGE INSPECTION HUB */}
            {activeTab === 'services' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Header & Stats Banner */}
                <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 rounded-3xl p-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-sm font-black text-white">
                          সেলার অ্যাকাউন্ট তৈরি ও লাইভ চ্যাট মনিটরিং সেন্টার
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        সকল সেলার অ্যাকাউন্ট এখান থেকেই তৈরি ও পাসওয়ার্ড নির্ধারণ করা হয়। সেলাররা ক্রেতাদের সাথে কি কথা বলছে তা লাইভ মনিটর করুন।
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingDev(!isAddingDev)}
                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAddingDev ? 'বাতিল করুন' : '+ নতুন সেলার তৈরি করুন'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={sellerSearchText}
                        onChange={(e) => setSellerSearchText(e.target.value)}
                        placeholder="সেলার নাম, ইউজারনেম (@username), সার্ভিস বা ফোন দিয়ে খুঁজুন..."
                        className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 font-sans"
                      />
                    </div>
                    <span className="text-xs text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-2 rounded-xl border border-emerald-500/30 font-mono shrink-0">
                      মোট সেলার: {developers.length} জন
                    </span>
                  </div>
                </div>

                {/* Create Seller Form Modal/Card */}
                {isAddingDev && (
                  <form
                    onSubmit={handleCreateDev}
                    className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">নতুন সেলার / হোস্ট অ্যাকাউন্ট ফরম</h4>
                      </div>
                      <span className="text-[11px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Admin Creator Mode
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          সেলার / হোস্টের নাম *:
                        </label>
                        <input
                          type="text"
                          required
                          value={devName}
                          onChange={(e) => setDevName(e.target.value)}
                          placeholder="যেমন: Priya Live Host বা Alex Studio"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          ইউজারনেম (Username) *:
                        </label>
                        <input
                          type="text"
                          required
                          value={devUsername}
                          onChange={(e) => setDevUsername(e.target.value)}
                          placeholder="যেমন: @priya_voice বা alex_dev"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-emerald-300 font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          লগইন পাসওয়ার্ড / সিক্রেট পিন *:
                        </label>
                        <input
                          type="text"
                          required
                          value={devPassword}
                          onChange={(e) => setDevPassword(e.target.value)}
                          placeholder="যেমন: 1234 বা seller789"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          মোবাইল নম্বর (Phone Number):
                        </label>
                        <input
                          type="tel"
                          value={devPhone}
                          onChange={(e) => setDevPhone(e.target.value)}
                          placeholder="যেমন: 017XXXXXXXX"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          সার্ভিস শিরোনাম (Service Title) *:
                        </label>
                        <input
                          type="text"
                          required
                          value={devService}
                          onChange={(e) => setDevService(e.target.value)}
                          placeholder="যেমন: প্রাইভেট লাইভ ভয়েস আড্ডা ও পরামর্শ বা কাস্টম বট সার্ভিস"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Gem className="w-3 h-3 text-cyan-400" />
                          <span>প্রতি ঘণ্টার ডায়মন্ড রেট (💎 Diamonds / Hour):</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={devPrice}
                          onChange={(e) => setDevPrice(e.target.value)}
                          placeholder="যেমন: 100"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          ক্যাটাগরি নির্বাচন:
                        </label>
                        <select
                          value={devCategory}
                          onChange={(e) => setDevCategory(e.target.value as Developer['category'])}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="app">📱 Voice / Host / Mobile App</option>
                          <option value="web">🌐 Web Development</option>
                          <option value="bot">🤖 Bot & Automation</option>
                          <option value="graphics">🎨 Graphics & Design</option>
                          <option value="security">🔒 Security & Audit</option>
                          <option value="marketing">📈 Digital Marketing</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          সেলার প্রোফাইল ছবি (Upload Photo or Paste URL):
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="text"
                            value={devAvatar}
                            onChange={(e) => setDevAvatar(e.target.value)}
                            placeholder="ছবির অনলাইন লিংক (URL) দিন বা ফাইল আপলোড করুন..."
                            className="flex-1 w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                          />
                          <label className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>ছবি আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSellerAvatarUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {devAvatar && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={devAvatar}
                              alt="Preview"
                              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40"
                            />
                            <span className="text-[11px] text-emerald-400 font-bold">✓ ছবি যুক্ত হয়েছে</span>
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          বায়ো ও বিবরণ (Bio):
                        </label>
                        <textarea
                          rows={2}
                          value={devBio}
                          onChange={(e) => setDevBio(e.target.value)}
                          placeholder="সেলার পরিচিতি বা বিশেষ বিবরণ..."
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingDev(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>✅ সেলার অ্যাকাউন্ট সেভ ও পাবলিশ করুন</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Seller Accounts List */}
                <div className="space-y-3">
                  {developers
                    .filter((dev) => {
                      const q = sellerSearchText.toLowerCase();
                      return (
                        dev.name.toLowerCase().includes(q) ||
                        dev.service.toLowerCase().includes(q) ||
                        (dev.username && dev.username.toLowerCase().includes(q)) ||
                        (dev.phone && dev.phone.includes(q))
                      );
                    })
                    .map((dev) => (
                      <div
                        key={dev.id}
                        className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                      >
                        {/* Avatar & Main Info */}
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shrink-0 shadow-md">
                            <img
                              src={dev.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dev.avatarSeed || dev.name}`}
                              alt={dev.name}
                              className="w-full h-full rounded-[14px] bg-slate-950 object-cover"
                            />
                            <span
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                                dev.online ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white">{dev.name}</h4>
                              <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/50">
                                {dev.username || `@seller_${dev.id}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateDeveloper(dev.id, { online: !dev.online });
                                  sounds.playReceive();
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                                  dev.online
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {dev.online ? '🟢 অনলাইন' : '⚪ অফলাইন'}
                              </button>
                            </div>

                            <p className="text-xs text-slate-300 mt-0.5 font-medium">{dev.service}</p>

                            {/* Credentials Strip for Admin */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                              <span className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono font-bold border border-slate-800">
                                🔒 পাসওয়ার্ড: {dev.password || '1234'}
                              </span>
                              <span className="font-mono text-slate-300">
                                📱 ফোন: {dev.phone || 'N/A'}
                              </span>
                              <span className="text-cyan-300 font-mono font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                                💎 {dev.diamondPerHour || dev.price || 100}/ঘণ্টা
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                          {/* 1. Live Chat Inspector Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedDev(dev);
                              sounds.playReceive();
                            }}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            title="সেলার কার সাথে কি কথা বলছে লাইভ দেখুন"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                            <span>💬 চ্যাট মনিটর</span>
                          </button>

                          {/* 2. Instant Impersonation Login to Seller Portal */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onImpersonateUser) {
                                onImpersonateUser(dev);
                              }
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            title="পাসওয়ার্ড ছাড়াই সরাসরি সেলার হিসেবে লগইন করুন"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>⚡ সেলার পোর্টালে প্রবেশ</span>
                          </button>

                          {/* 3. Delete Seller */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`আপনি কি "${dev.name}" সেলার অ্যাকাউন্টটি সম্পূর্ণ মুছে ফেলতে চান?`)) {
                                onDeleteDeveloper(dev.id);
                                sounds.playCancel();
                              }
                            }}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {developers.length === 0 && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                      <Store className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold">এখনও কোনো সেলার অ্যাকাউন্ট তৈরি করা হয়নি।</p>
                      <p className="text-xs text-slate-500 mt-1">
                        উপরের '+ নতুন সেলার তৈরি করুন' বাটনে ক্লিক করে সেলার যুক্ত করুন।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LIVE MESSAGE & CHAT INSPECTOR MODAL */}
            {inspectedDev && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
                <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        🛍️
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{inspectedDev.name} - এর লাইভ চ্যাট মেসেজ ও গ্রাহক বার্তা</span>
                          <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                            {inspectedDev.username || `@seller_${inspectedDev.id}`}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          ফোন: {inspectedDev.phone || 'N/A'} • সার্ভিস: {inspectedDev.service}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInspectedDev(null);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 min-h-[260px]">
                    {chatMessages
                      .filter((m) =>
                        inspectedDev
                          ? m.developerId === inspectedDev.id
                          : true // Shows full message stream if user
                      )
                      .map((msg) => {
                        const isUser = msg.sender === 'user';
                        const isAdminMsg = msg.sender === 'admin';
                        const isDev = msg.sender === 'developer';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} space-y-1`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span className="font-bold text-slate-300">
                                {isUser
                                  ? '👤 কাস্টমার'
                                  : isAdminMsg
                                  ? '🛡️ অ্যাডমিন'
                                  : isDev
                                  ? '💻 সেলার'
                                  : '🤖 বট'}
                              </span>
                              <span>• {msg.timestamp}</span>
                            </div>

                            <div
                              className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                isUser
                                  ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                                  : isAdminMsg
                                  ? 'bg-purple-900/60 border border-purple-500/40 text-purple-100 rounded-tr-none'
                                  : 'bg-emerald-900/50 border border-emerald-500/40 text-emerald-100 rounded-tr-none'
                              }`}
                            >
                              {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}
                              {msg.attachment?.type === 'image' && (
                                <img
                                  src={msg.attachment.url}
                                  alt="Attachment"
                                  className="w-full max-h-36 object-cover rounded-xl mt-1.5"
                                />
                              )}
                              {msg.attachment?.type === 'voice' && (
                                <div className="text-[11px] font-bold text-lime-400 bg-slate-950/60 p-1.5 rounded-lg mt-1">
                                  🎙️ ভয়েস বার্তা ({msg.attachment.duration || 2}s)
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {chatMessages.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        কোনো মেসেজ রেকর্ড পাওয়া যায়নি।
                      </div>
                    )}
                  </div>

                  {/* Send Admin Message Form into this user's thread */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!inspectorReplyText.trim() || !onSendMessage) return;
                      onSendMessage(
                        inspectorReplyText.trim(),
                        inspectedDev ? inspectedDev.id : undefined,
                        undefined,
                        'admin'
                      );
                      setInspectorReplyText('');
                      sounds.playSend();
                    }}
                    className="flex gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={inspectorReplyText}
                      onChange={(e) => setInspectorReplyText(e.target.value)}
                      placeholder="অ্যাডমিন হিসেবে সরাসরি রিপ্লাই মেসেজ পাঠান..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>পাঠান</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 6. PAYMENT SETTINGS & DIAMOND RATE TAB (Embeds PaymentSettings.tsx) */}
            {activeTab === 'settings' && (
              <div className="space-y-4 animate-fadeIn">
                <PaymentSettings
                  settings={editableSettings}
                  onSave={(updated) => {
                    setEditableSettings(updated);
                    onUpdateSettings(updated);
                  }}
                />
              </div>
            )}

            {/* 7. BROADCAST NOTICE & POPUP BANNER MANAGER TAB */}
            {activeTab === 'broadcast' && (
              <div className="space-y-5 animate-fadeIn">
                {/* A. MULTI-BANNER CAROUSEL MANAGER */}
                <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-amber-400" />
                        <span>🖼️ মাল্টি-ব্যানার ও ক্যারোসেল স্লাইডার ম্যানেজার</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        একের অধিক ব্যানার যুক্ত করতে পারেন। সাইটে প্রবেশের পর ব্যানারগুলো স্বয়ংক্রিয়ভাবে একটার পর একটা স্লাইড করবে।
                      </p>
                    </div>

                    {/* Top Stats & Master Toggle */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
                        মোট: {(editableConfig.popupBanners || []).length}টি | সক্রিয়: {(editableConfig.popupBanners || []).filter(b => b.active).length}টি
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditableConfig((prev) => ({
                            ...prev,
                            showPopupBanner: !prev.showPopupBanner,
                          }));
                          sounds.playClick();
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          editableConfig.showPopupBanner
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {editableConfig.showPopupBanner ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                            <span>পপআপ: ON</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                            <span>পপআপ: OFF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Add New Banner Button & Drawer */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>নতুন ব্যানার তৈরি ও আপলোড করুন</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewBanner(!isAddingNewBanner)}
                        className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        {isAddingNewBanner ? 'ফরম বন্ধ করুন' : '+ নতুন ব্যানার ফরম খুলুন'}
                      </button>
                    </div>

                    {isAddingNewBanner && (
                      <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        {/* Form Inputs */}
                        <div className="space-y-3">
                          {/* Image Upload / URL */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-amber-400" />
                              <span>১. ব্যানারের ছবি (আপলোড বা URL):</span>
                            </label>
                            <div className="flex gap-2">
                              <label className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition">
                                <Upload className="w-4 h-4 text-amber-400" />
                                <span>ছবি আপলোড করুন</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAddNewBannerFileUpload}
                                  className="hidden"
                                />
                              </label>
                              {newBannerImage && (
                                <button
                                  type="button"
                                  onClick={() => setNewBannerImage('')}
                                  className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition"
                                >
                                  মুছুন
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={newBannerImage}
                              onChange={(e) => setNewBannerImage(e.target.value)}
                              placeholder="বা ছবির অনলাইন লিংক দিন (https://...)"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Title */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">
                              ২. ব্যানারের শিরোনাম (Title):
                            </label>
                            <input
                              type="text"
                              value={newBannerTitle}
                              onChange={(e) => setNewBannerTitle(e.target.value)}
                              placeholder="যেমন: 🔥 ৫০% অতিরিক্ত ডায়মন্ড অফার!"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Subtitle */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">
                              ৩. ব্যানারের বিবরণ / সাবটাইটেল (Description):
                            </label>
                            <textarea
                              rows={2}
                              value={newBannerSubtitle}
                              onChange={(e) => setNewBannerSubtitle(e.target.value)}
                              placeholder="অফারের বিস্তারিত তথ্য ও বার্তা লিখুন..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Button text & Link */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-400">
                                ৪. বাটন টেক্সট:
                              </label>
                              <input
                                type="text"
                                value={newBannerButtonText}
                                onChange={(e) => setNewBannerButtonText(e.target.value)}
                                placeholder="এখনই দেখুন"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-400">
                                ৫. বাটন লিংক (ঐচ্ছিক):
                              </label>
                              <input
                                type="text"
                                value={newBannerLink}
                                onChange={(e) => setNewBannerLink(e.target.value)}
                                placeholder="https://t.me/..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {/* 1-Click Presets */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-semibold text-slate-400 block">
                              ⚡ রেডিমেড স্যাম্পল ব্যানার থেকে নির্বাচন করুন:
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                {
                                  label: '🎁 মেগা বোনাস',
                                  img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1000&q=80',
                                  title: '🔥 ৫০% অতিরিক্ত ডায়মন্ড বোনাস!',
                                  sub: 'আজকের স্পেশাল রিচার্জ অফার। সীমিত সময়ের জন্য রিচার্জে বাড়তি ডায়মন্ড উপভোগ করুন।',
                                  btn: 'রিচার্জ করুন'
                                },
                                {
                                  label: '🎙️ ভয়েস সেশন',
                                  img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80',
                                  title: '🎙️ লাইভ প্রাইভেট ভয়েস কল সেশন',
                                  sub: 'টপ হোস্ট ও সেলারদের সাথে ১-অন-১ এইচডি ভয়েস কলে সরাসরি কানেক্ট হন।',
                                  btn: 'হোস্ট দেখুন'
                                },
                                {
                                  label: '⚡ ইনস্ট্যান্ট হেল্প',
                                  img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
                                  title: '📢 ২৪/৭ অফিশিয়াল সাপোর্ট সেবা',
                                  sub: 'বিকাশ, নগদ ও রকেটে দ্রুত পেমেন্ট ও ডায়মন্ড রিচার্জ সেবা চালু আছে।',
                                  btn: 'হেল্পলাইনে কথা বলুন'
                                },
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setNewBannerImage(preset.img);
                                    setNewBannerTitle(preset.title);
                                    setNewBannerSubtitle(preset.sub);
                                    setNewBannerButtonText(preset.btn);
                                    sounds.playClick();
                                  }}
                                  className="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-amber-300 transition text-center cursor-pointer"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddBannerToList}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>➕ তালিকায় ব্যানারটি যুক্ত করুন</span>
                          </button>
                        </div>

                        {/* Preview of New Banner */}
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-[11px] font-bold text-amber-300">নতুন ব্যানারের প্রিভিউ</span>
                          <div className="mt-2 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950">
                            <div className="h-28 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                              {newBannerImage ? (
                                <img
                                  src={newBannerImage}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-3 text-slate-600 text-xs">ছবি যোগ করুন</div>
                              )}
                            </div>
                            <div className="p-3 space-y-1 bg-slate-900">
                              <h4 className="text-xs font-bold text-white line-clamp-1">
                                {newBannerTitle || 'ব্যানার শিরোনাম'}
                              </h4>
                              <p className="text-[10px] text-slate-400 line-clamp-2">
                                {newBannerSubtitle || 'ব্যানার বিবরণ'}
                              </p>
                              <div className="pt-1">
                                <span className="inline-block px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
                                  {newBannerButtonText || 'এখনই দেখুন'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 text-center pt-2">
                            ফরম পূরণ করে "তালিকায় ব্যানারটি যুক্ত করুন" চাপুন
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* List of Existing Banners */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span>বর্তমানে যুক্ত থাকা ব্যানারসমূহ (স্লাইডার লিস্ট):</span>
                      <span className="text-slate-400 font-normal">
                        {(editableConfig.popupBanners || []).length} টি ব্যানার রয়েছে
                      </span>
                    </h4>

                    {(editableConfig.popupBanners || []).length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                        <FileImage className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">কোনো ব্যানার যুক্ত করা নেই</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          নতুন ব্যানার তৈরি করতে ওপরের "+ নতুন ব্যানার ফরম খুলুন" বাটনে ক্লিক করুন
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(editableConfig.popupBanners || []).map((banner, index) => (
                          <div
                            key={banner.id || index}
                            className={`rounded-xl border overflow-hidden transition-all bg-slate-950 flex flex-col justify-between ${
                              banner.active
                                ? 'border-amber-500/40 shadow-sm shadow-amber-500/10'
                                : 'border-slate-800 opacity-60'
                            }`}
                          >
                            {/* Banner Image */}
                            <div className="relative h-28 bg-slate-900 overflow-hidden">
                              <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-amber-500/30">
                                #{index + 1}
                              </div>
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBannerItem(banner.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                    banner.active
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                                      : 'bg-slate-900 text-slate-500 border-slate-700'
                                  }`}
                                  title="চালু বা বন্ধ করুন"
                                >
                                  {banner.active ? 'সক্রিয়' : 'বন্ধ'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBannerItem(banner.id)}
                                  className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer transition"
                                  title="ব্যানার ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Banner Details */}
                            <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h5 className="text-xs font-bold text-white line-clamp-1">{banner.title}</h5>
                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                  {banner.subtitle || 'কোনো বিবরণ নেই'}
                                </p>
                              </div>
                              <div className="pt-2 flex items-center justify-between text-[10px] border-t border-slate-900">
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono">
                                  {banner.buttonText || 'এখনই দেখুন'}
                                </span>
                                {banner.link && (
                                  <span className="text-slate-500 truncate max-w-[120px] font-mono">
                                    {banner.link}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar: Live Preview & Save */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewPopupOpen(true);
                        sounds.playReceive();
                      }}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>🔍 পুরো স্ক্রিন টেস্ট পপআপ প্রিভিউ দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSiteConfig(editableConfig);
                        sounds.playSuccess();
                        triggerConfetti();
                        alert('✅ সকল ব্যানার সেটিংস সফলভাবে সেভ ও লাইভ করা হয়েছে!');
                      }}
                      className="w-full sm:flex-1 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>সকল ব্যানার পরিবর্তন ও প্রকাশ করুন</span>
                    </button>
                  </div>
                </div>

                {/* B. HOMEPAGE LIVE SUPPORT NOTICE BOX (Editable Section) */}
                <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                        <span>💬 হোমপেজ নোটিশ ও হেল্পলাইন মেসেজ বক্স (Homepage Notice Card)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        হোমপেজের মাঝে প্রদর্শিত নোটিশ বক্সটি এখান থেকে নিজের ইচ্ছেমতো যেকোনো মেসেজ লিখে পরিবর্তন করতে পারবেন।
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>হোমপেজ লাইভ</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Input */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-200 block">
                        হোমপেজ নোটিশ মেসেজ টেক্সট লিখুন:
                      </label>
                      <textarea
                        rows={5}
                        value={editableConfig.homeSupportNotice || ''}
                        onChange={(e) =>
                          setEditableConfig({
                            ...editableConfig,
                            homeSupportNotice: e.target.value,
                          })
                        }
                        placeholder="যেমন: 📢 জরুরি নোটিশ: যেকোনো সমস্যা বা তথ্যের জন্য হেল্পলাইন টেলিগ্রাম বা হোয়াটসঅ্যাপে যোগাযোগ করুন..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-cyan-500"
                      />

                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-slate-400 w-full">দ্রুত স্যাম্পল নোটিশ বসান:</span>
                        {[
                          {
                            title: '⚡ ২৪/৭ রিচার্জ নোটিশ',
                            text: '📢 অফিশিয়াল নোটিশ: বিকাশ, নগদ ও রকেটের মাধ্যমে ডায়মন্ড রিচার্জ ২৪ ঘণ্টা সক্রিয় আছে। কোনো অর্ডার আটকে গেলে সরাসরি মেসেজ করুন।'
                          },
                          {
                            title: '🎙️ ভয়েস সার্ভিস নোটিশ',
                            text: '🎙️ হোস্টদের সাথে ১-অন-১ লাইভ ভয়েস কল সেশন চালু রয়েছে। আপনার পছন্দের সেলারের প্রোফাইলে গিয়ে ডায়মন্ড দিয়ে সরাসরি কথা বলুন।'
                          },
                          {
                            title: '🎁 বোনাস অফার নোটিশ',
                            text: '🎁 বিশেষ মেগা অফার: প্রতিটি রিচার্জেই পাচ্ছেন অতিরিক্ত বোনাস ডায়মন্ড! অফারটি সীমিত সময়ের জন্য।'
                          }
                        ].map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEditableConfig({
                                ...editableConfig,
                                homeSupportNotice: sample.text
                              });
                              sounds.playClick();
                            }}
                            className="py-1 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-cyan-300 hover:text-cyan-200 transition cursor-pointer"
                          >
                            {sample.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: Live Mockup matching HomeView */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-2">
                          <Eye className="w-3.5 h-3.5" />
                          <span>হোমপেজে যেভাবে দেখা যাবে:</span>
                        </span>

                        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex items-start gap-3 shadow-inner">
                          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 border border-cyan-500/30">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-cyan-300">অফিশিয়াল নোটিশ ও সাপোর্ট বার্তা</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                LIVE
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-medium">
                              {editableConfig.homeSupportNotice || 'যেকোনো জিজ্ঞাসা বা হেল্পের জন্য অফিশিয়াল লাইভ চ্যাট অথবা হোয়াটসঅ্যাপ হেল্পলাইনে যোগাযোগ করতে পারেন।'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSiteConfig(editableConfig);
                            sounds.playSuccess();
                            triggerConfetti();
                            alert('✅ হোমপেজ নোটিশ মেসেজ সফলভাবে আপডেট ও সেভ হয়েছে!');
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>হোমপেজ মেসেজ সেভ করুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. FREE DIAMONDS & RECHARGE BONUS SETTINGS */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>🎁 ফ্রি ডায়মন্ড ও রিচার্জ বোনাস অফার সেটিংস</span>
                          <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                            অফার কনফিগ
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          নতুন একাউন্ট খোলার ফ্রি ডায়মন্ড এবং রিচার্জে বোনাস নির্ধারণ করুন।
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setEditableConfig((prev) => ({
                          ...prev,
                          freeDiamondsOfferEnabled: !prev.freeDiamondsOfferEnabled,
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        editableConfig.freeDiamondsOfferEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      {editableConfig.freeDiamondsOfferEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>অফার চালু (Active)</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-500" />
                          <span>অফার বন্ধ (Off)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Welcome Bonus */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>১. নতুন একাউন্টে ফ্রি ডায়মন্ড:</span>
                      </label>
                      <p className="text-[10px] text-slate-400">সাইন আপ করার সাথে সাথে জমা হবে</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={editableConfig.welcomeBonusDiamonds ?? 50}
                          onChange={(e) =>
                            setEditableConfig({
                              ...editableConfig,
                              welcomeBonusDiamonds: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-3 top-2 text-xs text-amber-400 font-bold">💎</span>
                      </div>
                    </div>

                    {/* 2. Recharge Bonus Percentage */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-lime-400" />
                        <span>২. রিচার্জ বোনাস শতকরা (%):</span>
                      </label>
                      <p className="text-[10px] text-slate-400">প্রতিটি রিচার্জের অতিরিক্ত শতাংশ</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editableConfig.rechargeBonusPercentage ?? 20}
                          onChange={(e) =>
                            setEditableConfig({
                              ...editableConfig,
                              rechargeBonusPercentage: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-lime-300 font-bold focus:outline-none focus:border-lime-500"
                        />
                        <span className="absolute right-3 top-2 text-xs text-lime-400 font-bold">%</span>
                      </div>
                    </div>

                    {/* 3. Flat Bonus */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Gem className="w-3.5 h-3.5 text-amber-400" />
                        <span>৩. অতিরিক্ত ফ্ল্যাট বোনাস:</span>
                      </label>
                      <p className="text-[10px] text-slate-400">নির্ধারিত অতিরিক্ত ফ্রি ডায়মন্ড</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={editableConfig.rechargeFlatBonusDiamonds ?? 10}
                          onChange={(e) =>
                            setEditableConfig({
                              ...editableConfig,
                              rechargeFlatBonusDiamonds: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                        />
                        <span className="absolute right-3 top-2 text-xs text-amber-400 font-bold">💎</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Offer Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 block">
                      অফার টাইটেল ও ব্যানার নোটিশ (কাস্টমার স্ক্রিনে প্রদর্শিত হবে):
                    </label>
                    <input
                      type="text"
                      value={editableConfig.freeDiamondsOfferTitle || ''}
                      onChange={(e) =>
                        setEditableConfig({
                          ...editableConfig,
                          freeDiamondsOfferTitle: e.target.value,
                        })
                      }
                      placeholder="🎁 নতুন একাউন্ট খুললেই ৫০ 💎 ফ্রি ওয়েলকাম বোনাস + প্রতিটি রিচার্জে ২০% অতিরিক্ত ডায়মন্ড অফার!"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSiteConfig(editableConfig);
                      sounds.playSuccess();
                      triggerConfetti();
                      alert('✅ ফ্রি ডায়মন্ড ও বোনাস অফার সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>ফ্রি ডায়মন্ড ও বোনাস সেটিংস সেভ করুন</span>
                  </button>
                </div>

                {/* C. TOP NOTICE BAR & MARQUEE ANNOUNCEMENT */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span>📢 টপ মারকুই নোটিশ ও টেক্সট এলার্ট</span>
                  </h3>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      চলমান টেক্সট নোটিশ (Marquee Alert):
                    </label>
                    <textarea
                      value={editableConfig.marqueeAlert || ''}
                      onChange={(e) =>
                        setEditableConfig({ ...editableConfig, marqueeAlert: e.target.value })
                      }
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      হোমপেজ ডিসকাউন্ট অফার টেক্সট (Notice Bar):
                    </label>
                    <input
                      type="text"
                      value={editableConfig.bannerNotice || ''}
                      onChange={(e) =>
                        setEditableConfig({ ...editableConfig, bannerNotice: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSiteConfig(editableConfig);
                      sounds.playSuccess();
                      alert('নোটিশ সেটিংস সংরক্ষিত হয়েছে!');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    টেক্সট নোটিশ সেভ করুন
                  </button>
                </div>
              </div>
            )}

            {/* LIVE CHAT & MESSAGING MONITOR TAB */}
            {activeTab === 'livechat' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>💬 রিয়েল-টাইম লাইভ চ্যাট রুম ও মনিটরিং</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        অ্যাডমিন হিসেবে সরাসরি ইউজারের সাথে চ্যাট করুন অথবা নির্দিষ্ট হোস্ট হিসেবে রিপ্লাই দিন।
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedChatDevId !== undefined ? selectedChatDevId : 'general'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedChatDevId(val === 'general' ? undefined : Number(val));
                        }}
                        className="bg-slate-950 border border-slate-700 text-xs text-emerald-300 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="general">🤖 AI সাপোর্ট ডেস্ক (জেনারেল)</option>
                        {developers.map((d) => (
                          <option key={d.id} value={d.id}>
                            👤 {d.name} ({d.service})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filtered Messages Thread for selected chat */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 h-80 overflow-y-auto space-y-3">
                    {chatMessages
                      .filter((m) =>
                        selectedChatDevId === undefined
                          ? !m.developerId || m.developerId === 0
                          : m.developerId === selectedChatDevId
                      )
                      .map((msg) => {
                        const isUser = msg.sender === 'user';
                        const isAdminMsg = msg.sender === 'admin';
                        const isDev = msg.sender === 'developer';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} space-y-1`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span className="font-bold text-slate-300">
                                {isUser
                                  ? '👤 ইউজার'
                                  : isAdminMsg
                                  ? '🛡️ অ্যাডমিন'
                                  : isDev
                                  ? '💻 হোস্ট'
                                  : '🤖 বট'}
                              </span>
                              <span>• {msg.timestamp}</span>
                            </div>

                            <div
                              className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                                isUser
                                  ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                                  : isAdminMsg
                                  ? 'bg-purple-900/60 border border-purple-500/40 text-purple-100 rounded-tr-none'
                                  : 'bg-emerald-900/50 border border-emerald-500/40 text-emerald-100 rounded-tr-none'
                              }`}
                            >
                              {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}
                              {msg.attachment?.type === 'image' && (
                                <img
                                  src={msg.attachment.url}
                                  alt="Attachment"
                                  className="w-full max-h-36 object-cover rounded-xl mt-1.5"
                                />
                              )}
                              {msg.attachment?.type === 'voice' && (
                                <div className="text-[11px] font-bold text-lime-400 bg-slate-950/60 p-1.5 rounded-lg mt-1">
                                  🎙️ ভয়েস বার্তা ({msg.attachment.duration || 2}s)
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {chatMessages.filter((m) =>
                      selectedChatDevId === undefined
                        ? !m.developerId || m.developerId === 0
                        : m.developerId === selectedChatDevId
                    ).length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        এই রুমে এখনো কোনো মেসেজ আদান-প্রদান হয়নি।
                      </div>
                    )}
                  </div>

                  {/* Send Admin Message Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!adminChatText.trim() || !onSendMessage) return;
                      onSendMessage(
                        adminChatText.trim(),
                        selectedChatDevId,
                        undefined,
                        adminChatAsHost ? 'developer' : 'admin'
                      );
                      setAdminChatText('');
                      sounds.playSend();
                    }}
                    className="space-y-2 pt-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>কাকে পাঠাচ্ছেন: <strong>{selectedChatDevId ? developers.find(d => d.id === selectedChatDevId)?.name : 'AI সাপোর্ট রুম'}</strong></span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-semibold">
                        <input
                          type="checkbox"
                          checked={adminChatAsHost}
                          onChange={(e) => setAdminChatAsHost(e.target.checked)}
                          className="rounded text-emerald-500"
                        />
                        <span>হোস্ট পরিচয়ে পাঠান</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={adminChatText}
                        onChange={(e) => setAdminChatText(e.target.value)}
                        placeholder="অ্যাডমিন হিসেবে রিয়েল-টাইম রিপ্লাই লিখুন..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={!adminChatText.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>পাঠান</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 8. BOT AUTO-REPLY RULES */}
            {activeTab === 'bot' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    চ্যাটবট অটো-রিপ্লাই ও এফএকিউ রুলস
                  </h3>

                  <form onSubmit={handleAddBotReplyRule} className="space-y-2 pt-2">
                    <input
                      type="text"
                      value={newBotTrigger}
                      onChange={(e) => setNewBotTrigger(e.target.value)}
                      placeholder="কীওয়ার্ড (যেমন: রিচার্জ / অফার / ডায়মন্ড)..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <textarea
                      value={newBotResponse}
                      onChange={(e) => setNewBotResponse(e.target.value)}
                      rows={2}
                      placeholder="বটের স্বয়ংক্রিয় উত্তর লিখুন..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      + নতুন অটো-রিপ্লাই যোগ করুন
                    </button>
                  </form>
                </div>

                <div className="space-y-2">
                  {botReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                            🔑 {reply.trigger}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{reply.response}</p>
                      </div>

                      <button
                        onClick={() => onDeleteBotReply(reply.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. HISTORY TAB: COMPLETED ORDERS & SENT DIAMONDS LOGS */}
            {activeTab === 'history' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>📜 সম্পন্ন অর্ডার ও ডায়মন্ড সেন্ডিং হিস্ট্রি</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    সকল অনুমোদিত রিচার্জ ও সফল বুকিং অর্ডারের বিস্তারিত লগ
                  </p>

                  <div className="space-y-2.5">
                    {approvedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{req.userName}</span>
                          <span className="text-[10px] text-cyan-300 font-mono ml-1.5">({req.userId})</span>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {req.method} • TxID: {req.trxId} • {req.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400">+{req.amountDiamonds} 💎</span>
                          <span className="text-[10px] text-slate-400 block font-mono">৳{req.bdtAmount} BDT</span>
                        </div>
                      </div>
                    ))}
                    {approvedRequests.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">এখনো কোনো অনুমোদিত রিচার্জ নেই।</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL SCREEN INTERACTIVE TEST POPUP MODAL */}
      <AnimatePresence>
        {isPreviewPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div
              onClick={() => {
                setIsPreviewPopupOpen(false);
                sounds.playClick();
              }}
              className="absolute inset-0"
            />
            {(() => {
              const activeList = (editableConfig.popupBanners || []).filter((b) => b.active);
              const currentBanner =
                activeList.length > 0
                  ? activeList[previewSlideIndex % activeList.length]
                  : {
                      image: editableConfig.popupBannerImage,
                      title: editableConfig.popupBannerTitle,
                      subtitle: editableConfig.popupBannerSubtitle,
                      buttonText: editableConfig.popupBannerButtonText,
                      link: editableConfig.popupBannerLink,
                    };

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl z-10"
                >
                  {/* Close [X] Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewPopupOpen(false);
                      sounds.playClick();
                    }}
                    className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/80 hover:bg-rose-600 text-white border border-white/20 transition-all duration-200 shadow-lg cursor-pointer hover:scale-110 active:scale-95"
                    title="বন্ধ করুন"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Image & Carousel Arrows */}
                  <div className="relative w-full h-56 bg-slate-950 overflow-hidden flex items-center justify-center">
                    {currentBanner?.image ? (
                      <img
                        src={currentBanner.image}
                        alt="ব্যানার"
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                    ) : (
                      <span className="text-slate-500 text-xs">কোনো ছবি নেই</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-[11px] font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>লাইভ টেস্ট প্রিভিউ ({activeList.length > 0 ? `${(previewSlideIndex % activeList.length) + 1}/${activeList.length}` : '১/১'})</span>
                    </div>

                    {/* Navigation Arrows for Preview if multiple */}
                    {activeList.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSlideIndex((prev) => (prev > 0 ? prev - 1 : activeList.length - 1));
                            sounds.playClick();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition cursor-pointer"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSlideIndex((prev) => (prev + 1) % activeList.length);
                            sounds.playClick();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition cursor-pointer"
                        >
                          ›
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                          {activeList.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPreviewSlideIndex(idx)}
                              className={`h-1.5 rounded-full transition-all ${
                                (previewSlideIndex % activeList.length) === idx
                                  ? 'w-4 bg-amber-400'
                                  : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-5 space-y-3 bg-slate-900">
                    {currentBanner?.title && (
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>{currentBanner.title}</span>
                      </h3>
                    )}
                    {currentBanner?.subtitle && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentBanner.subtitle}
                      </p>
                    )}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`অ্যাকশন লিংক: ${currentBanner?.link || 'লিংক দেওয়া হয়নি'}`);
                          setIsPreviewPopupOpen(false);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                      >
                        <span>{currentBanner?.buttonText || 'এখনই দেখুন'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPreviewPopupOpen(false);
                          sounds.playClick();
                        }}
                        className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
                      >
                        বন্ধ
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
