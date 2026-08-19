import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ExternalLink, ChevronRight, ChevronLeft, BellRing } from 'lucide-react';
import { SiteConfig, MarketingBanner } from '../types';
import { sounds } from '../utils/sound';

interface EntrancePopupBannerProps {
  siteConfig: SiteConfig;
  onNavigateToRecharge?: () => void;
}

export const EntrancePopupBanner: React.FC<EntrancePopupBannerProps> = ({
  siteConfig,
  onNavigateToRecharge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Compute active banners list
  const activeBanners: MarketingBanner[] = React.useMemo(() => {
    if (siteConfig.popupBanners && siteConfig.popupBanners.length > 0) {
      const activeList = siteConfig.popupBanners.filter((b) => b.active !== false && b.image);
      if (activeList.length > 0) return activeList;
    }
    // Fallback to legacy single banner if available
    if (siteConfig.popupBannerImage) {
      return [
        {
          id: 'default-single',
          image: siteConfig.popupBannerImage,
          title: siteConfig.popupBannerTitle,
          subtitle: siteConfig.popupBannerSubtitle,
          buttonText: siteConfig.popupBannerButtonText,
          link: siteConfig.popupBannerLink,
          active: true,
        },
      ];
    }
    return [];
  }, [
    siteConfig.popupBanners,
    siteConfig.popupBannerImage,
    siteConfig.popupBannerTitle,
    siteConfig.popupBannerSubtitle,
    siteConfig.popupBannerButtonText,
    siteConfig.popupBannerLink,
  ]);

  const hasBanners = activeBanners.length > 0;
  const isEnabled = siteConfig.showPopupBanner !== false;

  useEffect(() => {
    if (!isEnabled || !hasBanners) {
      setIsOpen(false);
      return;
    }

    // Automatically trigger entrance banner smoothly whenever loaded
    const timer = setTimeout(() => {
      setIsOpen(true);
      sounds.playReceive();
    }, 600);

    return () => clearTimeout(timer);
  }, [isEnabled, hasBanners]);

  // Carousel auto-slide timer
  useEffect(() => {
    if (!isOpen || isPaused || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, activeBanners.length]);

  const handleClose = () => {
    sounds.playClick();
    setIsOpen(false);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handleActionClick = () => {
    handleClose();
    if (currentBanner?.link) {
      if (currentBanner.link.startsWith('http')) {
        window.open(currentBanner.link, '_blank', 'noopener,noreferrer');
      }
    } else if (onNavigateToRecharge) {
      onNavigateToRecharge();
    }
  };

  if (!isEnabled || !hasBanners || !currentBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0"
          />

          {/* Modal Container - fully responsive across mobile, tablet & desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative w-full max-w-[360px] xs:max-w-sm sm:max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 z-10 flex flex-col my-auto max-h-[92vh]"
          >
            {/* Top Right Close [X] Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/80 hover:bg-rose-600 text-white border border-white/20 transition-all duration-200 shadow-xl cursor-pointer hover:scale-110 active:scale-95 group"
              title="ব্যানারটি বন্ধ করুন"
              aria-label="Close banner"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {/* Banner Image with responsive aspect ratio & Carousel navigation */}
            <div className="relative w-full h-48 xs:h-56 sm:h-64 bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentBanner.id || currentIndex}
                  src={currentBanner.image}
                  alt={currentBanner.title || 'অফিসিয়াল ব্যানার'}
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80';
                  }}
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent pointer-events-none" />

              {/* Tag / Badge & Multiple Banners Counter */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[10px] sm:text-[11px] font-bold text-amber-300 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>অফিসিয়াল অফার ও নোটিশ</span>
                </div>

                {activeBanners.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white font-bold">
                    {currentIndex + 1}/{activeBanners.length}
                  </span>
                )}
              </div>

              {/* Navigation Left / Right Arrows (if more than 1 banner) */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition active:scale-95 cursor-pointer shadow-lg hover:scale-110"
                    title="আগের ব্যানার"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition active:scale-95 cursor-pointer shadow-lg hover:scale-110"
                    title="পরের ব্যানার"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Carousel Pagination Dots */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {activeBanners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setCurrentIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentIndex
                            ? 'w-6 bg-amber-400 shadow-sm shadow-amber-400/50'
                            : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                        title={`ব্যানার ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 pt-3 space-y-3 bg-slate-900 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner.id || currentIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  {currentBanner.title && (
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-white flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{currentBanner.title}</span>
                    </h3>
                  )}

                  {currentBanner.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {currentBanner.subtitle}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-orange-500/20 transition active:scale-[0.98] cursor-pointer"
                >
                  <span>{currentBanner.buttonText || 'এখনই দেখুন'}</span>
                  {currentBanner.link ? (
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition active:scale-[0.98] cursor-pointer shrink-0"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

