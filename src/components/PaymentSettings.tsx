import React, { useState } from 'react';
import { PaymentSettings as PaymentSettingsType } from '../types';
import { Settings, PhoneCall, Gem, Save, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/sound';

interface PaymentSettingsProps {
  settings?: PaymentSettingsType;
  onSave?: (updated: PaymentSettingsType) => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ settings, onSave }) => {
  const [bkashNumber, setBkashNumber] = useState(settings?.bkashNumber || '01344252686');
  const [nagadNumber, setNagadNumber] = useState(settings?.nagadNumber || '01344252686');
  const [rocketNumber, setRocketNumber] = useState(settings?.rocketNumber || '01900000000');
  const [upayNumber, setUpayNumber] = useState(settings?.upayNumber || '01500000000');
  const [diamondRate, setDiamondRate] = useState({
    BDT: 100,
    diamonds: 100,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    sounds.playSuccess();
    if (onSave) {
      onSave({
        bkashNumber,
        nagadNumber,
        rocketNumber,
        upayNumber,
        telegramSupportUrl: '',
        ratePerDiamondBdt: diamondRate.BDT / (diamondRate.diamonds || 1),
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    alert('পেমেন্ট ও ডায়মন্ড সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>⚙️ পেমেন্ট মেথড ও ডায়মন্ড রেট সেটিং</span>
        </h3>
        {savedSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> সংরক্ষিত
          </span>
        )}
      </div>

      {/* নাম্বার সেটআপ */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-300">পেমেন্ট গেটওয়ে নম্বর সেটআপ (Send Money)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-pink-400 font-semibold block mb-1">bKash নম্বর:</label>
            <input
              type="text"
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-orange-400 font-semibold block mb-1">Nagad নম্বর:</label>
            <input
              type="text"
              value={nagadNumber}
              onChange={(e) => setNagadNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-purple-400 font-semibold block mb-1">Rocket নম্বর:</label>
            <input
              type="text"
              value={rocketNumber}
              onChange={(e) => setRocketNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-sky-400 font-semibold block mb-1">Upay নম্বর:</label>
            <input
              type="text"
              value={upayNumber}
              onChange={(e) => setUpayNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* ডায়মন্ড রেট ক্যালকুলেটর সেটআপ */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5 text-amber-400" />
          <span>💎 ডায়মন্ড রেট হিসাব</span>
        </h4>
        <div className="flex gap-3 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block mb-1">টাকা (BDT):</span>
            <input
              type="number"
              value={diamondRate.BDT}
              onChange={(e) => setDiamondRate({ ...diamondRate, BDT: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>
          <span className="text-lg font-black text-emerald-400 font-mono pt-4">=</span>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block mb-1">ডায়মন্ড (Diamonds):</span>
            <input
              type="number"
              value={diamondRate.diamonds}
              onChange={(e) => setDiamondRate({ ...diamondRate, diamonds: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveSettings}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Save className="w-3.5 h-3.5" />
        <span>সেটিংস সংরক্ষণ করুন</span>
      </button>
    </div>
  );
};
