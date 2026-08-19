import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Gem,
  Copy,
  Check,
  ShieldCheck,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  UserCheck,
  Edit3,
  Smartphone,
  CreditCard,
  Send,
  Lock,
  MessageSquare,
  Zap,
  Info,
  Crown,
  Store,
  LogIn
} from 'lucide-react';
import { PaymentMethod, PaymentRequest, PaymentSettings, RechargePackage, UserAccount, UserSession } from '../types';
import { RECHARGE_PACKAGES } from '../data/initialData';
import { sounds } from '../utils/sound';

interface SupportMsg {
  id: string;
  sender: 'user' | 'support';
  text: string;
  time: string;
}

interface ProfileViewProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSwitchUser?: (userId: string) => void;
  onUpdateUserName?: (userId: string, name: string, phone: string) => void;
  onUpdateBio?: (userId: string, bio: string) => void;
  onRegisterUser?: (name: string, username: string, phone: string) => void;
  diamonds: number;
  paymentRequests: PaymentRequest[];
  paymentSettings: PaymentSettings;
  onSubmitPayment: (data: {
    method: PaymentMethod;
    diamonds: number;
    bdtAmount: number;
    senderPhone: string;
    lastDigits?: string;
    trxId: string;
  }) => void;
  onOpenAdmin: () => void;
  onOpenSellerPortal?: () => void;
  onOpenLoginModal?: () => void;
  onCopyText: (text: string) => void;
  currentSession?: UserSession | null;
  onLoginSession?: (session: UserSession) => void;
  onLogoutSession?: () => void;
  isOwner?: boolean;
  isSeller?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  diamonds,
  paymentRequests,
  paymentSettings,
  onSubmitPayment,
  onOpenAdmin,
  onOpenSellerPortal,
  onOpenLoginModal,
  onCopyText,
  onUpdateUserName,
  currentSession,
  onLoginSession,
  onLogoutSession,
  isOwner: isOwnerProp,
  isSeller: isSellerProp,
}) => {
  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bKash');
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage>(RECHARGE_PACKAGES[1]);
  const [customAmount, setCustomAmount] = useState<string>('300');
  const [senderPhoneInput, setSenderPhoneInput] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Edit profile inline state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser.name);
  const [editPhone, setEditPhone] = useState<string>(currentUser.phone);

  // Support Chat state
  const [chatInput, setChatInput] = useState<string>('');
  const [supportMessages, setSupportMessages] = useState<SupportMsg[]>([
    {
      id: 'msg-1',
      sender: 'support',
      text: 'স্বাগতম! পেমেন্ট ভেরিফাই হলে অ্যাডমিন ইন-অ্যাপ মেসেজে সরাসরি ডায়মন্ড ও সার্ভিস কনফার্মেশন প্রদান করবেন।',
      time: 'সক্রিয়',
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isOwner = isOwnerProp !== undefined ? isOwnerProp : (currentSession?.role === 'owner' || currentSession?.isOwner === true);
  const isSeller = isSellerProp !== undefined ? isSellerProp : (currentSession?.role === 'seller');

  useEffect(() => {
    setEditName(currentUser.name);
    setEditPhone(currentUser.phone);
  }, [currentUser]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [supportMessages]);

  const getMethodNumber = (method: PaymentMethod) => {
    switch (method) {
      case 'bKash':
        return paymentSettings.bkashNumber;
      case 'Nagad':
        return paymentSettings.nagadNumber;
      case 'Rocket':
        return paymentSettings.rocketNumber;
      case 'Upay':
        return paymentSettings.upayNumber;
    }
  };

  const handleCopy = (number: string) => {
    onCopyText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handlePackageSelect = (pkg: RechargePackage) => {
    setSelectedPackage(pkg);
    setCustomAmount((pkg.diamonds + pkg.bonus).toString());
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (onUpdateUserName) {
      onUpdateUserName(currentUser.id, editName.trim(), editPhone.trim());
    }
    setIsEditingProfile(false);
    sounds.playSuccess();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhoneInput.trim()) {
      sounds.playError();
      alert('অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন সেই মোবাইল নম্বরটি লিখুন!');
      return;
    }

    const diamondAmt = parseInt(customAmount) || selectedPackage.diamonds;
    const bdtAmt = Math.round((diamondAmt / (paymentSettings.diamondRateDiamonds || 100)) * (paymentSettings.diamondRateBdt || 100));

    const finalTrx = trxId.trim() ? trxId.trim().toUpperCase() : `DIRECT-${Date.now().toString().slice(-6)}`;

    onSubmitPayment({
      method: selectedMethod,
      diamonds: diamondAmt,
      bdtAmount: bdtAmt,
      senderPhone: senderPhoneInput.trim(),
      lastDigits: senderPhoneInput.trim().slice(-4),
      trxId: finalTrx,
    });

    setTrxId('');
    setSenderPhoneInput('');
    sounds.playSuccess();
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg: SupportMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setSupportMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    sounds.playSend();

    setTimeout(() => {
      let botResponse = 'আপনার মেসেজটি সাপোর্ট সেন্টারে পৌঁছেছে। অ্যাডমিন দ্রুত চেক করে ডায়মন্ড ইস্যু করবেন।';
      if (userText.toLowerCase().includes('trx') || userText.toLowerCase().includes('টাকা') || userText.toLowerCase().includes('পেমেন্ট')) {
        botResponse = '💎 Send Money সম্পন্ন করে নিচে TrxID ও প্রেরক ফোন নম্বর সাবমিট করুন, ১-৫ মিনিটের মধ্যে ডায়মন্ড যোগ হবে।';
      }

      setSupportMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'support',
          text: botResponse,
          time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      sounds.playReceive();
    }, 800);
  };

  const myRequests = paymentRequests.filter(
    (req) => req.userId === currentUser.id || req.userName === currentUser.name
  );

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* ১. হেডার সেকশন & ডায়মন্ড ওয়ালেট ব্যালেন্স */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Gem className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-100 block leading-tight">ডায়মন্ড ওয়ালেট</span>
            <span className="text-[10px] text-slate-400">
              ইউজার আইডি: <strong className="text-cyan-300 font-mono">{currentUser.id}</strong>
            </span>
          </div>
        </div>
        <div className="bg-slate-900 px-3.5 py-1.5 rounded-full border border-amber-500/60 text-xs font-black text-amber-300 shadow-md shadow-amber-500/10 flex items-center gap-1.5">
          <span>💎</span>
          <span id="user-diamonds" className="font-mono text-sm">
            {isOwner ? '∞ আনলিমিটেড' : diamonds.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            {isOwner ? '(সেন্ট্রাল)' : 'ডায়মন্ড'}
          </span>
        </div>
      </div>

      {/* ২. প্রোফাইল ম্যানেজমেন্ট */}
      <div id="profile-box" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                className="w-12 h-12 rounded-xl border border-amber-500 bg-slate-950 object-cover shadow"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full" title="অনলাইন" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="display-name" className="font-extrabold text-sm text-amber-300">
                  {currentUser.name}
                </h3>
                {isOwner ? (
                  <span className="text-[9px] bg-lime-500/20 text-lime-300 font-black px-1.5 py-0.2 rounded border border-lime-500/40">
                    👑 ওনার
                  </span>
                ) : isSeller ? (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded border border-amber-500/40">
                    🛍️ সেলার
                  </span>
                ) : (
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-500/30">
                    {currentUser.role === 'vip' ? 'VIP' : 'PRO'}
                  </span>
                )}
              </div>
              <p id="display-username" className="text-xs text-slate-400 font-mono mt-0.5">
                আইডি: <span className="text-cyan-400 font-bold">{currentUser.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenLoginModal && (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                title="লগইন বা একাউন্ট পরিবর্তন"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold">লগইন</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
              title="তথ্য এডিট করুন"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold">এডিট</span>
            </button>
          </div>
        </div>

        {/* Role based quick action button */}
        {isOwner && (
          <div className="p-3 bg-gradient-to-r from-rose-950/60 to-slate-950 border border-rose-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-rose-200">ওনার ডাটাবেজ কন্ট্রোল প্যানেল</span>
            </div>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              প্যানেল খুলুন
            </button>
          </div>
        )}

        {isSeller && onOpenSellerPortal && (
          <div className="p-3 bg-gradient-to-r from-amber-950/60 to-slate-950 border border-amber-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200">আপনার সেলার শপ পোর্টাল</span>
            </div>
            <button
              type="button"
              onClick={onOpenSellerPortal}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              শপ পরিচালনা করুন
            </button>
          </div>
        )}

        {isEditingProfile && (
          <form onSubmit={handleProfileSave} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">নাম:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">ফোন নম্বর:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
          </form>
        )}
      </div>

      {/* ৩. ডায়মন্ড রিচার্জ ও পেমেন্ট সেকশন (bKash / Nagad / Rocket / Upay) */}
      <div id="recharge-box" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>ডায়মন্ড কিনুন (পেমেন্ট গেটওয়ে)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold">১-ক্লিক ভেরিফিকেশন</span>
              </h3>
              <p className="text-[10px] text-slate-400">টাকা পাঠিয়ে প্রেরক নম্বরটি দিন (TrxID বাধ্যতামূলক নয়, ওনার টিক দিলেই কনফার্ম)</p>
            </div>
          </div>
          <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            ১০০ 💎 = ১০০ টাকা
          </span>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(['bKash', 'Nagad', 'Rocket', 'Upay'] as PaymentMethod[]).map((method) => {
            const isSelected = selectedMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setSelectedMethod(method);
                  sounds.playClick();
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? method === 'bKash'
                      ? 'bg-pink-600/30 border-pink-500 text-pink-300 shadow-md shadow-pink-500/20'
                      : method === 'Nagad'
                      ? 'bg-orange-600/30 border-orange-500 text-orange-300 shadow-md shadow-orange-500/20'
                      : method === 'Rocket'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                      : 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{method}</span>
                <span className="text-[9px] font-normal text-slate-400">Send Money</span>
              </button>
            );
          })}
        </div>

        {/* Selected Number Box with Copy */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">{selectedMethod} পার্সোনাল নম্বর:</span>
            <span className="text-sm font-mono font-black text-amber-300 tracking-wider">
              {getMethodNumber(selectedMethod)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(getMethodNumber(selectedMethod))}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedNumber === getMethodNumber(selectedMethod) ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>কপি নম্বর</span>
              </>
            )}
          </button>
        </div>

        {/* Packages */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300 block">প্যাকেজ বাছাই করুন:</label>
          <div className="grid grid-cols-3 gap-2">
            {RECHARGE_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black block text-amber-300">
                    {pkg.diamonds} 💎
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ৳{pkg.bdtPrice}
                  </span>
                  {pkg.badge && (
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold mt-0.5 inline-block">
                      {pkg.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Submit Form */}
        <form onSubmit={handlePaymentSubmit} className="space-y-2.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">যে নম্বর থেকে টাকা পাঠিয়েছেন:</label>
              <input
                type="text"
                required
                value={senderPhoneInput}
                onChange={(e) => setSenderPhoneInput(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                TrxID / রেফারেন্স <span className="text-slate-500">(ঐচ্ছিক)</span>:
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="যেমন: 8N7A6D5E (বা খালি রাখুন)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>কনফার্ম রিচার্জ রিকোয়েস্ট পাঠান</span>
          </button>
        </form>
      </div>

      {/* ৪. ইন-অ্যাপ লাইভ সাপোর্ট বক্স */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200">প্রাইভেট ইন-অ্যাপ হেল্পডেস্ক</h3>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="অনলাইন" />
        </div>

        <div
          ref={chatScrollRef}
          className="h-32 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 overflow-y-auto space-y-2 text-xs scrollbar-none"
        >
          {supportMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-xl max-w-[85%] ${
                msg.sender === 'user'
                  ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 ml-auto'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 mr-auto'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                <span>{msg.sender === 'user' ? 'আপনি' : 'হেল্পডেস্ক'}</span>
                <span>{msg.time}</span>
              </div>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChatMessage} className="flex items-center gap-1.5">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="যেকোনো সাহায্য বা সমস্যার জন্য মেসেজ লিখুন..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>পাঠান</span>
          </button>
        </form>
      </div>

      {/* ৫. রিচার্জ ইতিহাস */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <History className="w-4 h-4 text-cyan-400" />
          <span>{currentUser.name}-এর রিচার্জ ইতিহাস ({myRequests.length})</span>
        </h3>

        {myRequests.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">
            কোনো পেন্ডিং বা পূর্বের রিচার্জ রেকর্ড নেই।
          </p>
        ) : (
          <div className="space-y-2">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[10px] text-amber-300 font-bold">{req.method}</span>
                    <span className="font-mono text-cyan-400">TrxID: {req.trxId}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{req.date} • প্রেরক: {req.senderPhone}</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-amber-300 flex items-center justify-end gap-1">
                    <Gem className="w-3 h-3 text-amber-400" /> {req.amountDiamonds}
                  </span>
                  <div className="mt-0.5">
                    {req.status === 'pending' && (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center justify-end gap-0.5">
                        <Clock className="w-3 h-3" /> পেন্ডিং
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> সফল
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center justify-end gap-0.5">
                        <XCircle className="w-3 h-3" /> বাতিল
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ONLY OWNER gets secret admin link */}
      {isOwner && (
        <div className="text-center pt-1">
          <button
            onClick={onOpenAdmin}
            className="text-xs text-rose-400/80 hover:text-rose-300 transition flex items-center justify-center gap-1 mx-auto py-2 px-4 rounded-xl hover:bg-slate-900 border border-slate-800 cursor-pointer font-bold"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>ওনার কন্ট্রোল প্যানেল (usplabonadmin@gmail.com)</span>
          </button>
        </div>
      )}
    </div>
  );
};
