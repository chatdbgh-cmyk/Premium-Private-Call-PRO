import React, { useState, useRef } from 'react';
import {
  Store,
  User,
  ShoppingBag,
  MessageSquare,
  Gem,
  CheckCircle,
  Clock,
  Send,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Edit3,
  Phone,
  ExternalLink,
  ShieldCheck,
  Star,
  DollarSign,
  TrendingUp,
  Sliders,
  Check,
  X,
  Radio,
  ArrowLeft,
  Zap,
  ArrowUpRight,
  Wallet,
  Building2,
  Smartphone,
  AlertCircle,
  Copy,
  History
} from 'lucide-react';
import { Developer, ServiceOrder, ChatMessage, UserAccount, SellerWithdrawRequest } from '../types';
import { sounds } from '../utils/sound';

interface SellerPortalProps {
  seller: Developer;
  sellerAccount?: UserAccount;
  orders: ServiceOrder[];
  chatMessages: ChatMessage[];
  withdrawRequests?: SellerWithdrawRequest[];
  onUpdateSellerProfile: (updated: Partial<Developer>) => void;
  onUpdateOrderStatus: (orderId: string, status: ServiceOrder['status'], note?: string) => void;
  onSendMessage: (text: string, developerId?: number, recipientName?: string) => void;
  onRequestWithdraw?: (req: {
    amountDiamonds: number;
    bdtAmount: number;
    paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Bank';
    accountNumber: string;
    accountType: 'Personal' | 'Agent';
    note?: string;
  }) => void;
  onBackToMarketplace?: () => void;
}

export const SellerPortal: React.FC<SellerPortalProps> = ({
  seller,
  sellerAccount,
  orders,
  chatMessages,
  withdrawRequests = [],
  onUpdateSellerProfile,
  onUpdateOrderStatus,
  onSendMessage,
  onRequestWithdraw,
  onBackToMarketplace,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'chat' | 'earnings'>('profile');

  // Profile Editor state
  const [name, setName] = useState(seller.name);
  const [username, setUsername] = useState(seller.username || sellerAccount?.username || '');
  const [service, setService] = useState(seller.service);
  const [category, setCategory] = useState<Developer['category']>(seller.category || 'app');
  const [price, setPrice] = useState(seller.price.toString());
  const [bio, setBio] = useState(seller.bio || '');
  const [skills, setSkills] = useState(seller.skills ? seller.skills.join(', ') : '');
  const [phone, setPhone] = useState(seller.phone || sellerAccount?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(seller.avatar || sellerAccount?.avatar || '');
  const [isOnline, setIsOnline] = useState(seller.online);
  const [diamondPerHour, setDiamondPerHour] = useState(seller.diamondPerHour?.toString() || '100');
  const [isSaved, setIsSaved] = useState(false);

  // Chat state
  const [chatText, setChatText] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Diamond Withdraw State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Bank'>('bKash');
  const [withdrawAccountNum, setWithdrawAccountNum] = useState(seller.phone || sellerAccount?.phone || '');
  const [withdrawAccountType, setWithdrawAccountType] = useState<'Personal' | 'Agent'>('Personal');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawFeedback, setWithdrawFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available seller balance
  const currentSellerDiamonds = sellerAccount?.diamonds ?? seller.totalEarningsDiamonds ?? 500;
  const thisSellerWithdrawRequests = withdrawRequests.filter((r) => r.sellerId === seller.id);

  // Filter orders for this seller
  const sellerOrders = orders.filter((o) => o.developerId === seller.id);
  const pendingOrders = sellerOrders.filter((o) => o.status === 'pending');
  const inProgressOrders = sellerOrders.filter((o) => o.status === 'in_progress');
  const completedOrders = sellerOrders.filter((o) => o.status === 'completed');

  // Filter chat messages for this seller
  const sellerMessages = chatMessages.filter(
    (m) => m.developerId === seller.id || m.senderName === seller.name
  );

  // Handle Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('ছবি সাইজ ৩ মেগাবাইটের কম হতে হবে!');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          sounds.playSuccess();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateSellerProfile({
      name: name.trim(),
      username: username.trim(),
      service: service.trim(),
      category,
      price: parseInt(price) || 100,
      bio: bio.trim(),
      skills: skillsArray,
      phone: phone.trim(),
      avatar: avatarUrl || undefined,
      online: isOnline,
      diamondPerHour: parseInt(diamondPerHour) || 100,
    });

    setIsSaved(true);
    sounds.playSuccess();
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    onSendMessage(`[${seller.name} - সেলার]: ${chatText.trim()}`, seller.id);
    setChatText('');
    sounds.playSuccess();
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn text-slate-100">
      {/* Top Seller Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Avatar with live photo */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 overflow-hidden">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.name}`}
                  alt={seller.name}
                  className="w-full h-full object-cover rounded-2xl bg-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="ছবি পরিবর্তন করুন"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">{seller.name}</h2>
                <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase rounded-full">
                  🛍️ সেলার শপ
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {username || `@seller_${seller.id}`}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {seller.rating || 5.0} ({seller.completedOrders || 0} সার্ভিস সম্পন্ন)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newStatus = !isOnline;
                    setIsOnline(newStatus);
                    onUpdateSellerProfile({ online: newStatus });
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  {isOnline ? 'অনলাইন' : 'অফলাইন'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats & Action */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl px-3 py-2 text-right shadow-md">
              <span className="text-[10px] text-amber-300 font-semibold block">উইথড্র ব্যালেন্স</span>
              <span className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-end gap-1">
                <Gem className="w-4 h-4 text-amber-400 animate-pulse" />
                {currentSellerDiamonds.toLocaleString()} 💎
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('earnings');
                setIsWithdrawModalOpen(true);
              }}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              title="ওনারের কাছে ডায়মন্ড ক্যাশআউট রিকোয়েস্ট পাঠান"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>উইথড্র</span>
            </button>

            {onBackToMarketplace && (
              <button
                type="button"
                onClick={onBackToMarketplace}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>মার্কেটপ্লেস</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation for Seller Portal */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>শপ প্রোফাইল ও সেটিংস</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>কাস্টমার অর্ডার</span>
            {pendingOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>লাইভ চ্যাট ইনবক্স</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'earnings'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ইনকাম ও উইথড্র</span>
            {thisSellerWithdrawRequests.some((r) => r.status === 'pending') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* TAB 1: Shop Profile Builder */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <Store className="w-4 h-4 text-cyan-400" />
                <span>সেলার শপ ও প্রোফাইল তৈরি / এডিট</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার নাম, ছবি, সার্ভিস বিবরণ ও ডায়মন্ড রেট কাস্টমাইজ করুন।
              </p>
            </div>
            {isSaved && (
              <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5" /> সংরক্ষিত হয়েছে
              </span>
            )}
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>প্রোফাইল পিকচার / লোগো:</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                </button>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="অথবা ইমেজ URL দিন (https://...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                আপনার নাম / শপের নাম:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: Alex বা David"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ইউজারনেম (Handle):
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="যেমন: @alex_host"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Service Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                সার্ভিস টাইটেল:
              </label>
              <input
                type="text"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="যেমন: প্রাইভেট লাইভ চ্যাট ও ভয়েস কল"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                সার্ভিস ক্যাটাগরি:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Developer['category'])}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="app">🎙️ ভয়েস ও লাইভ সেশন</option>
                <option value="bot">🤖 চ্যাট ও পরামর্শক</option>
                <option value="web">🌐 ওয়েব ডেভেলপমেন্ট</option>
                <option value="graphics">🎨 গ্রাফিক্স ও ডিজাইন</option>
                <option value="security">🛡️ সিকিউরিটি ও প্রাইভেসি</option>
              </select>
            </div>
          </div>

          {/* Price & Diamond Per Hour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                সার্ভিস মূল্য (ডায়মন্ড 💎):
              </label>
              <input
                type="number"
                min="10"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ঘণ্টা প্রতি রেট (💎/ঘণ্টা):
              </label>
              <input
                type="number"
                min="10"
                value={diamondPerHour}
                onChange={(e) => setDiamondPerHour(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Bio / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              শপ বায়ো / সার্ভিস বিবরণ:
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="আপনার সার্ভিস সম্পর্কে বিস্তারিত লিখুন..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Skills & Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              স্কিলস / স্পেশালিটি (কমা দিয়ে আলাদা করুন):
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="ভয়েস কল, প্রাইভেট চ্যাট, ইনস্ট্যান্ট কানেক্ট"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Contact Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              মোবাইল নম্বর / পাসওয়ার্ড নম্বর:
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>শপ প্রোফাইল আপডেট সংরক্ষণ করুন</span>
          </button>
        </form>
      )}

      {/* TAB 2: Customer Orders */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>আপনার শপের কাস্টমার অর্ডার সমূহ ({sellerOrders.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                কাস্টমাররা আপনার সার্ভিস বুক করলে এখানে দেখা যাবে।
              </p>
            </div>
          </div>

          {sellerOrders.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">এখনও কোনো অর্ডার নেই</p>
              <p className="text-xs text-slate-500 mt-1">
                কাস্টমাররা আপনার সার্ভিস বুক করলে সঙ্গে সঙ্গে এখানে নোটিফিকেশন পাবেন।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sellerOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          অর্ডার #{order.id}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {order.date}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-300 font-semibold mt-1">
                        সার্ভিস: {order.developerService || order.serviceName}
                        {order.durationText && (
                          <span className="ml-2 text-[10px] text-lime-300 bg-lime-950/70 border border-lime-500/30 px-1.5 py-0.5 rounded font-normal">
                            ⏱️ {order.durationText}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        👤 যিনি অর্ডার করেছেন (কাস্টমার): <span className="text-amber-300 font-bold">{order.userName || 'কাস্টমার'}</span>
                        {order.userPhone && (
                          <span className="text-slate-400 font-mono text-[11px] ml-1.5 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            📞 {order.userPhone}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1">
                        <Gem className="w-3.5 h-3.5 text-amber-400" />
                        {order.priceDiamonds} 💎
                      </span>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : order.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : order.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {order.status === 'completed'
                          ? '✅ সম্পন্ন'
                          : order.status === 'in_progress'
                          ? '⏳ চলমান'
                          : order.status === 'pending'
                          ? '🔔 নতুন অর্ডার'
                          : 'বাতিল'}
                      </span>
                    </div>
                  </div>

                  {/* Requirements Note if provided */}
                  {order.requirements && (
                    <div className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                        📝 কাস্টমারের নোট / মেসেজ:
                      </span>
                      <p className="text-slate-200">{order.requirements}</p>
                    </div>
                  )}

                  {/* Order Status Action Controls */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'in_progress', 'কাজ শুরু হয়েছে');
                          sounds.playSuccess();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>অর্ডার গ্রহণ করুন ও কাজ শুরু করুন</span>
                      </button>
                    )}

                    {order.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'completed', 'কাজ সফলভাবে ডেলিভারি করা হয়েছে');
                          sounds.playSuccess();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>কাজ ডেলিভারি ও সম্পন্ন করুন</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('chat');
                        setChatText(`[অর্ডার #${order.id} সম্পর্কে]: `);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>কাস্টমারের সাথে কথা বলুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Live Customer Chat Inbox */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>লাইভ কাস্টমার ইনবক্স</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                কাস্টমারদের সাথে সরাসরি কথা বলুন এবং সার্ভিস সংক্রান্ত উত্তর দিন।
              </p>
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-64 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 overflow-y-auto space-y-2.5">
            {sellerMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                কোনো মেসেজ হিস্ট্রি নেই। কাস্টমার মেসেজ পাঠালে এখানে দেখতে পাবেন।
              </div>
            ) : (
              sellerMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-2xl text-xs max-w-[85%] ${
                    msg.sender === 'developer' || msg.senderName === seller.name
                      ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 ml-auto'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-auto'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold">
                      {msg.sender === 'developer' || msg.senderName === seller.name ? 'আপনি (সেলার)' : 'কাস্টমার'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="কাস্টমারকে উত্তর লিখুন..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatText.trim()}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>পাঠান</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Earnings & Diamond Withdrawal */}
      {activeTab === 'earnings' && (
        <div className="space-y-4">
          {/* Main Earnings & Cashout Overview Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                  Seller Wallet & Cashout
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>শপ ইনকাম ও ডায়মন্ড উইথড্র সেন্টার</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  আপনার আয় করা ডায়মন্ড ওনারের কাছে উইথড্র রিকোয়েস্ট পাঠিয়ে বিকাশ, নগদ বা রকেটে সরাসরি ক্যাশআউট করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount(currentSellerDiamonds > 0 ? Math.min(currentSellerDiamonds, 100).toString() : '50');
                  setWithdrawFeedback(null);
                  setIsWithdrawModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>উইথড্র রিকোয়েস্ট পাঠান</span>
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3.5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-lg"></div>
                <Gem className="w-5 h-5 text-amber-400 mx-auto mb-1 animate-pulse" />
                <span className="text-[11px] text-amber-300 font-bold block">উইথড্রযোগ্য ব্যালেন্স</span>
                <span className="text-base sm:text-lg font-black text-amber-300">
                  {currentSellerDiamonds.toLocaleString()} 💎
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  (৳ {currentSellerDiamonds.toLocaleString()} টাকা)
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
                <DollarSign className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block font-medium">কনভার্সন রেট</span>
                <span className="text-base font-black text-white">১ 💎 = ১ ৳</span>
                <span className="text-[10px] text-slate-500 block">১০০% ভ্যালু এক্সচেঞ্জ</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block font-medium">সম্পন্ন সার্ভিস</span>
                <span className="text-base font-black text-emerald-300">
                  {seller.completedOrders || 0} টি
                </span>
                <span className="text-[10px] text-slate-500 block">রেটিং: {seller.rating || 5.0} ★</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
                <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block font-medium">পেন্ডিং উইথড্র</span>
                <span className="text-base font-black text-indigo-300">
                  {thisSellerWithdrawRequests.filter((r) => r.status === 'pending').length} টি
                </span>
                <span className="text-[10px] text-slate-500 block">ওনার ভেরিফিকেশন</span>
              </div>
            </div>

            {/* Quick Notice Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-amber-300">উইথড্র সিস্টেম গাইডলাইন:</strong> উইথড্র বাটনে ক্লিক করে আপনার বিকাশ/নগদ/রকেট নম্বর সাবমিট করলে রিকোয়েস্টটি সরাসরি ওনারের উইথড্র ইনবক্সে চলে যাবে। ওনার যাচাই করে আপনার নাম্বারে টাকা পাঠিয়ে দিলে আপনার ব্যালেন্স আপডেট হয়ে যাবে।
              </p>
            </div>
          </div>

          {/* WITHDRAW REQUEST HISTORY SECTION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm sm:text-base font-bold text-white">আমার উইথড্র হিস্ট্রি</h4>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {thisSellerWithdrawRequests.length} টি
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount(currentSellerDiamonds > 0 ? Math.min(currentSellerDiamonds, 100).toString() : '50');
                  setWithdrawFeedback(null);
                  setIsWithdrawModalOpen(true);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                + নতুন উইথড্র
              </button>
            </div>

            {thisSellerWithdrawRequests.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-800/80 p-4">
                <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  এখনো কোনো উইথড্র রিকোয়েস্ট করেননি। ডায়মন্ড ক্যাশআউট করতে উপরের বাটনে ক্লিক করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {thisSellerWithdrawRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">
                          #{req.id}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {req.status === 'approved'
                            ? '✅ টাকা পাঠানো হয়েছে (ভেরিফাইড)'
                            : req.status === 'rejected'
                            ? '❌ বাতিল ও রিফান্ডেড'
                            : '⏳ ওনার রিভিউতে আছে (টাকা পাঠানো হচ্ছে)'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {req.requestedAt}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <Gem className="w-3.5 h-3.5 text-amber-400" />
                          {req.amountDiamonds} 💎 (৳ {req.bdtAmount} টাকা)
                        </span>
                        <span>•</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-cyan-300">
                          {req.paymentMethod} ({req.accountType || 'Personal'})
                        </span>
                        <span className="font-mono text-slate-200">
                          নম্বর: {req.accountNumber}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-sm font-black text-emerald-400 block font-mono">
                        ৳ {req.bdtAmount} BDT
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {req.status === 'approved' ? '✅ টাকা প্রাপ্ত হয়েছে' : '⏳ পেন্ডিং'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WITHDRAW POPUP MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">ডায়মন্ড উইথড্র রিকোয়েস্ট</h3>
                  <p className="text-[11px] text-slate-400">ওনারের কাছে ডায়মন্ড ক্যাশআউট রিকোয়েস্ট পাঠান</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amount = parseInt(withdrawAmount, 10);
                if (isNaN(amount) || amount <= 0) {
                  setWithdrawFeedback({ type: 'error', message: 'সঠিক ডায়মন্ড পরিমাণ লিখুন!' });
                  return;
                }
                if (amount > currentSellerDiamonds) {
                  setWithdrawFeedback({
                    type: 'error',
                    message: `আপনার একাউন্টে পর্যাপ্ত ডায়মন্ড নেই! বর্তমান ব্যালেন্স: ${currentSellerDiamonds} 💎`,
                  });
                  return;
                }
                if (amount < 50) {
                  setWithdrawFeedback({ type: 'error', message: 'সর্বনিম্ন ৫০ ডায়মন্ড উইথড্র করা যাবে!' });
                  return;
                }
                if (!withdrawAccountNum.trim() || withdrawAccountNum.trim().length < 9) {
                  setWithdrawFeedback({ type: 'error', message: 'সঠিক পেমেন্ট / বিকাশ নম্বর লিখুন!' });
                  return;
                }

                if (onRequestWithdraw) {
                  onRequestWithdraw({
                    amountDiamonds: amount,
                    bdtAmount: amount, // 1 Diamond = 1 BDT
                    paymentMethod: withdrawMethod,
                    accountNumber: withdrawAccountNum.trim(),
                    accountType: withdrawAccountType,
                    note: withdrawNote.trim() || undefined,
                  });
                  sounds.playSuccess();
                  setWithdrawFeedback({
                    type: 'success',
                    message: `আপনার ${amount} 💎 (${amount} টাকা) উইথড্র রিকোয়েস্ট সফলভাবে ওনারের কাছে পাঠানো হয়েছে! ওনার ভেরিফাই করে টাকা পাঠিয়ে দেবেন।`,
                  });
                  setTimeout(() => {
                    setIsWithdrawModalOpen(false);
                    setWithdrawFeedback(null);
                  }, 2200);
                }
              }}
              className="p-4 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {/* Balance preview */}
              <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">বর্তমান উইথড্রযোগ্য ব্যালেন্স:</span>
                  <span className="text-sm font-black text-amber-300 flex items-center gap-1">
                    <Gem className="w-4 h-4 text-amber-400" />
                    {currentSellerDiamonds.toLocaleString()} 💎
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">টাকায় সমপরিমাণ:</span>
                  <span className="text-sm font-bold text-white">৳ {currentSellerDiamonds.toLocaleString()} BDT</span>
                </div>
              </div>

              {/* Feedback messages */}
              {withdrawFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    withdrawFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border border-rose-500/50 text-rose-200'
                  }`}
                >
                  {withdrawFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{withdrawFeedback.message}</span>
                </div>
              )}

              {/* Amount Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>উইথড্র ডায়মন্ড পরিমাণ</span>
                  <span className="text-amber-400 font-mono">
                    পাবেন: ৳ {parseInt(withdrawAmount, 10) || 0} টাকা
                  </span>
                </label>

                {/* Preset Pills */}
                <div className="grid grid-cols-4 gap-1.5 pb-1">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={amt > currentSellerDiamonds}
                      onClick={() => setWithdrawAmount(amt.toString())}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border cursor-pointer ${
                        withdrawAmount === amt.toString()
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                          : amt > currentSellerDiamonds
                          ? 'opacity-40 bg-slate-950 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {amt} 💎
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max={currentSellerDiamonds}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="৫০ বা তার বেশি ডায়মন্ড..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(currentSellerDiamonds.toString())}
                    className="absolute right-1.5 top-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    সব (MAX)
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  টাকা রিসিভ করার মেথড নির্বাচন করুন
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['bKash', 'Nagad', 'Rocket', 'Bank'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition border flex flex-col items-center gap-1 cursor-pointer ${
                        withdrawMethod === m
                          ? m === 'bKash'
                            ? 'bg-pink-600/30 border-pink-500 text-pink-300 shadow'
                            : m === 'Nagad'
                            ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow'
                            : m === 'Rocket'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow'
                            : 'bg-blue-600/30 border-blue-500 text-blue-300 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>
                        {m === 'bKash' ? 'বিকাশ' : m === 'Nagad' ? 'নগদ' : m === 'Rocket' ? 'রকেট' : 'ব্যাংক'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>{withdrawMethod} নম্বর / একাউন্ট নম্বর</span>
                  <span className="text-[10px] text-slate-400">যে নম্বরে টাকা পাঠানো হবে</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={withdrawAccountNum}
                    onChange={(e) => setWithdrawAccountNum(e.target.value)}
                    placeholder="017xxxxxxxx"
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3.5 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-400">একাউন্ট টাইপ:</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="accType"
                    checked={withdrawAccountType === 'Personal'}
                    onChange={() => setWithdrawAccountType('Personal')}
                    className="text-amber-400 focus:ring-amber-400"
                  />
                  <span>পার্সোনাল (Personal)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="accType"
                    checked={withdrawAccountType === 'Agent'}
                    onChange={() => setWithdrawAccountType('Agent')}
                    className="text-amber-400 focus:ring-amber-400"
                  />
                  <span>এজেন্ট (Agent)</span>
                </label>
              </div>

              {/* Optional Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  ওনারের জন্য কোনো মেসেজ / নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="উদা: বিকাশ পার্সোনাল ক্যাশ আউট ফি সহ পাঠাবেন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none text-xs"
                />
              </div>

              {/* Summary & Submit */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={
                    currentSellerDiamonds < 50 ||
                    parseInt(withdrawAmount, 10) > currentSellerDiamonds ||
                    !withdrawAccountNum.trim()
                  }
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>উইথড্র কনফার্ম করুন (৳ {parseInt(withdrawAmount, 10) || 0} ৳)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
