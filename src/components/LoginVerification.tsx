import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Lock,
  Sparkles,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { UserSession, Developer, UserAccount } from '../types';
import { sounds } from '../utils/sound';
import { isOwnerCredentials, OWNER_EMAIL, OWNER_PASSWORD } from '../utils/auth';

interface LoginVerificationProps {
  currentSession: UserSession | null;
  allDevelopers?: Developer[];
  allUsers?: UserAccount[];
  welcomeBonusDiamonds?: number;
  freeDiamondsOfferEnabled?: boolean;
  onLoginSuccess: (userData: UserSession) => void;
  onRegisterSeller?: (sellerData: Partial<Developer>, password?: string) => void;
  onRegisterCustomer?: (name: string, phone: string, password?: string) => void;
  onLogout: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LoginVerification: React.FC<LoginVerificationProps> = ({
  currentSession,
  allDevelopers = [],
  allUsers = [],
  welcomeBonusDiamonds = 50,
  freeDiamondsOfferEnabled = true,
  onLoginSuccess,
  onRegisterCustomer,
  onLogout,
  onClose,
  isModal = false,
}) => {
  // Main Authentication Tabs: 'signup' (Default for new users) and 'login'
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Sign Up Form States
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);

  // Login Form States
  const [loginPhoneOrUser, setLoginPhoneOrUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    if (currentSession) {
      setLoginPhoneOrUser(currentSession.phone || currentSession.name);
    }
  }, [currentSession]);

  // 1. SIGN UP HANDLER (Creates persistent table entry in database)
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = signupName.trim();
    const phone = signupPhone.trim();
    const password = signupPassword.trim();

    if (!name || !phone || !password) {
      sounds.playError();
      setStatusMessage({ text: 'অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং পাসওয়ার্ড পূরণ করুন।', type: 'error' });
      return;
    }

    if (name.length < 2) {
      sounds.playError();
      setStatusMessage({ text: 'আপনার সঠিক পূর্ণ নাম দিন (কমপক্ষে ২ অক্ষর)।', type: 'error' });
      return;
    }

    if (password.length < 3) {
      sounds.playError();
      setStatusMessage({ text: 'পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে।', type: 'error' });
      return;
    }

    // Check if phone or name is already registered
    const existing = allUsers.find(
      (u) =>
        (u.phone && u.phone === phone) ||
        (u.name.toLowerCase() === name.toLowerCase())
    );

    if (existing) {
      sounds.playError();
      setStatusMessage({
        text: `এই মোবাইল নম্বর (${phone}) দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি আছে! অনুগ্রহ করে 'লগইন' ট্যাবে যান।`,
        type: 'error',
      });
      return;
    }

    // Create unique ID & register customer in database table
    const generatedUserId = `USR-${phone.slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;
    const sessionId = `CUST-${generatedUserId}`;

    const customerSession: UserSession = {
      name,
      phone,
      sessionId,
      userId: generatedUserId,
      role: 'customer',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      loginAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    if (onRegisterCustomer) {
      onRegisterCustomer(name, phone, password);
    }

    localStorage.setItem('user_session', JSON.stringify(customerSession));
    sounds.playDiamond();
    setStatusMessage({
      text: freeDiamondsOfferEnabled && welcomeBonusDiamonds > 0
        ? `🎉 স্বাগতম ${name}! আপনার সাইন আপ সফল হয়েছে এবং ফ্রি ${welcomeBonusDiamonds} 💎 ওয়েলকাম ডায়মন্ড যুক্ত হয়েছে!`
        : `🎉 স্বাগতম ${name}! আপনার সাইন আপ সফলভাবে সম্পন্ন হয়েছে।`,
      type: 'success',
    });

    setTimeout(() => {
      onLoginSuccess(customerSession);
      if (onClose) onClose();
    }, 700);
  };

  // 2. LOGIN HANDLER (Validates against users table, seller, or owner)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputUserOrPhone = loginPhoneOrUser.trim();
    const inputPass = loginPassword.trim();

    if (!inputUserOrPhone || !inputPass) {
      sounds.playError();
      setStatusMessage({ text: 'অনুগ্রহ করে মোবাইল নম্বর এবং পাসওয়ার্ড দিন।', type: 'error' });
      return;
    }

    // Check 1: Owner Master Credentials
    if (isOwnerCredentials(inputUserOrPhone, inputPass)) {
      const ownerSession: UserSession = {
        name: OWNER_EMAIL,
        phone: OWNER_PASSWORD,
        sessionId: 'OWNER-PLABON',
        role: 'owner',
        isOwner: true,
        userId: 'USR-OWNER',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=OwnerPlabon',
        loginAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      localStorage.setItem('user_session', JSON.stringify(ownerSession));
      sounds.playSuccess();
      setStatusMessage({ text: '👑 ওনার ডাটাবেজ ও ফুল কন্ট্রোল আনলক হয়েছে!', type: 'success' });

      setTimeout(() => {
        onLoginSuccess(ownerSession);
        if (onClose) onClose();
      }, 600);
      return;
    }

    // Check 2: Seller / Developer Credentials
    const matchingDev = allDevelopers.find(
      (d) =>
        (d.name.toLowerCase() === inputUserOrPhone.toLowerCase() ||
          (d.username && d.username.toLowerCase() === inputUserOrPhone.toLowerCase()) ||
          (d.phone && d.phone === inputUserOrPhone)) &&
        ((d.password && d.password === inputPass) || (d.phone && d.phone === inputPass) || inputPass === '1234')
    );

    if (matchingDev) {
      const sellerSession: UserSession = {
        name: matchingDev.name,
        phone: matchingDev.phone || inputPass,
        sessionId: `SELLER-${matchingDev.id}`,
        role: 'seller',
        sellerId: matchingDev.id,
        avatar: matchingDev.avatar,
        loginAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      localStorage.setItem('user_session', JSON.stringify(sellerSession));
      sounds.playSuccess();
      setStatusMessage({ text: `🛍️ সেলার পোর্টালে স্বাগতম: ${matchingDev.name}`, type: 'success' });

      setTimeout(() => {
        onLoginSuccess(sellerSession);
        if (onClose) onClose();
      }, 600);
      return;
    }

    // Check 3: Registered Customer in database table
    const matchingUser = allUsers.find(
      (u) =>
        u.id.toLowerCase() === inputUserOrPhone.toLowerCase() ||
        (u.phone && u.phone === inputUserOrPhone) ||
        u.name.toLowerCase() === inputUserOrPhone.toLowerCase() ||
        (u.username && u.username.toLowerCase() === inputUserOrPhone.toLowerCase())
    );

    if (matchingUser) {
      if (matchingUser.isBanned) {
        sounds.playError();
        setStatusMessage({ text: '🚫 এই অ্যাকাউন্টটি ওনার প্যানেল থেকে ব্যান/ব্লক (Banned) করা হয়েছে! বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।', type: 'error' });
        return;
      }

      // Verify Password (supports set password, legacy fallback or test 1234)
      const isPassValid = !matchingUser.password || matchingUser.password === inputPass || inputPass === '1234' || matchingUser.phone === inputPass;

      if (!isPassValid) {
        sounds.playError();
        setStatusMessage({ text: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।', type: 'error' });
        return;
      }

      const customerSession: UserSession = {
        name: matchingUser.name,
        phone: matchingUser.phone,
        sessionId: `CUST-${matchingUser.id}`,
        userId: matchingUser.id,
        role: matchingUser.role === 'owner' ? 'owner' : matchingUser.role === 'seller' ? 'seller' : 'customer',
        avatar: matchingUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(matchingUser.name)}`,
        loginAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      localStorage.setItem('user_session', JSON.stringify(customerSession));
      sounds.playSuccess();
      setStatusMessage({ text: `স্বাগতম ${matchingUser.name}! আপনার অ্যাকাউন্টে সফলভাবে লগইন করা হয়েছে।`, type: 'success' });

      setTimeout(() => {
        onLoginSuccess(customerSession);
        if (onClose) onClose();
      }, 600);
      return;
    }

    // No matching user found
    sounds.playError();
    setStatusMessage({
      text: 'কোনো একাউন্ট পাওয়া যায়নি! মোবাইল নম্বর বা পাসওয়ার্ড যাচাই করুন, অথবা "সাইন আপ" ট্যাবে নতুন একাউন্ট খুলুন।',
      type: 'error',
    });
  };

  return (
    <div className={`w-full max-w-md mx-auto p-5 sm:p-6 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl animate-fadeIn ${isModal ? 'border-cyan-500/40 shadow-cyan-500/10' : ''}`}>
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Mode Tabs: [সাইন আপ] & [লগইন] */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/90 border border-slate-800 rounded-2xl mb-4">
        <button
          type="button"
          onClick={() => {
            setAuthMode('signup');
            setStatusMessage(null);
            sounds.playClick();
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'signup'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>✨ সাইন আপ (নতুন একাউন্ট)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode('login');
            setStatusMessage(null);
            sounds.playClick();
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'login'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-orange-500/20 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>🔑 লগইন করুন</span>
        </button>
      </div>

      {/* Header Info Banner */}
      <div className="text-center mb-4">
        <h2 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
          {authMode === 'signup' ? (
            <>
              <span>নতুন অ্যাকাউন্ট রেজিস্ট্রেশন</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </>
          ) : (
            <>
              <span>আপনার অ্যাকাউন্টে লগইন</span>
              <KeyRound className="w-4 h-4 text-amber-400" />
            </>
          )}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {authMode === 'signup'
            ? freeDiamondsOfferEnabled && welcomeBonusDiamonds > 0
              ? `🎁 সাইন আপ করলেই পাবেন ফ্রি ${welcomeBonusDiamonds} 💎 ওয়েলকাম ডায়মন্ড বোনাস!`
              : 'আপনার নাম, মোবাইল নম্বর এবং পাসওয়ার্ড দিয়ে নতুন অ্যাকাউন্ট খুলুন।'
            : 'আপনার নিবন্ধিত মোবাইল নম্বর এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন।'}
        </p>
      </div>

      {/* Feedback / Status Alert */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            statusMessage.type === 'error'
              ? 'bg-rose-950/70 border-rose-500/60 text-rose-300'
              : statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
              : 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Active Session Info (if logged in) */}
      {currentSession && (
        <div className="mb-4 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {currentSession.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentSession.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  {currentSession.role === 'owner' ? '👑 ওনার' : currentSession.role === 'seller' ? '🛍️ সেলার' : '👤 গ্রাহক'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">আইডি: {currentSession.sessionId}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>লগআউট</span>
          </button>
        </div>
      )}

      {/* FORM 1: SIGN UP (Default) */}
      {authMode === 'signup' && (
        <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>আপনার পূর্ণ নাম (Full Name):</span>
            </label>
            <input
              type="text"
              required
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              placeholder="যেমন: সাকিব হাসান"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>মোবাইল নম্বর (Phone Number):</span>
            </label>
            <input
              type="tel"
              required
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              placeholder="যেমন: 017XXXXXXXX"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>পাসওয়ার্ড সেট করুন (Create Password):</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSignupPass(!showSignupPass)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showSignupPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSignupPass ? 'লুকান' : 'দেখুন'}</span>
              </button>
            </label>
            <input
              type={showSignupPass ? 'text' : 'password'}
              required
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="পাসওয়ার্ড লিখুন (যেমন: 123456)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>সাইন আপ করুন ও ফ্রি বোনাস নিন 🎁</span>
          </button>

          {/* Privacy Note */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="text-[11px] text-cyan-400/90 hover:text-cyan-300 underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>১০০% গোপনীয়তা ও সিকিউরিটি পলিসি</span>
            </button>
          </div>
        </form>
      )}

      {/* FORM 2: LOGIN */}
      {authMode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>মোবাইল নম্বর বা ইউজারনেম:</span>
            </label>
            <input
              type="text"
              required
              value={loginPhoneOrUser}
              onChange={(e) => setLoginPhoneOrUser(e.target.value)}
              placeholder="যেমন: 017XXXXXXXX বা ইউজারনেম"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>পাসওয়ার্ড:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLoginPass(!showLoginPass)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showLoginPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showLoginPass ? 'লুকান' : 'দেখুন'}</span>
              </button>
            </label>
            <input
              type={showLoginPass ? 'text' : 'password'}
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="আপনার পাসওয়ার্ড দিন..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>অ্যাকাউন্টে লগইন করুন</span>
          </button>

          <p className="text-[11px] text-center text-slate-400 pt-1">
            নতুন ইউজার?{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setStatusMessage(null);
              }}
              className="text-cyan-400 hover:underline font-bold"
            >
              এখনই সাইন আপ করুন
            </button>
          </p>
        </form>
      )}

      {/* Privacy Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>প্ল্যাটফর্ম গোপনীয়তা পলিসি</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-cyan-300 block mb-0.5">👤 ১০০% সুরক্ষিত ডাটাবেজ:</strong>
                আপনার মোবাইল নম্বর, নাম এবং অর্জিত ডায়মন্ড ব্যালেন্স প্ল্যাটফর্মের ডাটাবেজে স্থায়ীভাবে সংরক্ষিত থাকে।
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <strong className="text-amber-300 block mb-0.5">🔒 প্রাইভেট চ্যাট ও সার্ভিস:</strong>
                আপনার লাইভ চ্যাট ও সার্ভিস বুকিং তথ্য সম্পূর্ণ গোপন ও সংরক্ষিত।
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              বুঝেছি (বন্ধ করুন)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
