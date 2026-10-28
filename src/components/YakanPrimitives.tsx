import React from 'react';

/**
 * Removed multi-color stripe ribbon per user request (Image 1).
 */
export const YakanWeaveRibbon: React.FC<{ className?: string }> = () => null;

/**
 * Clean, professional E-Governance card surface (supports Light Mode default & Dark Mode).
 */
export const YakanTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}> = ({ children, className = '', glowColor, onClick }) => {
  const topAccent =
    glowColor === 'crimson'
      ? 'border-t-[3px] border-t-[#B91C1C]'
      : glowColor === 'sapphire'
      ? 'border-t-[3px] border-t-[#1D4ED8]'
      : glowColor === 'gold'
      ? 'border-t-[3px] border-t-[#D97706]'
      : glowColor === 'emerald'
      ? 'border-t-[3px] border-t-[#059669]'
      : '';

  return (
    <div
      onClick={onClick}
      className={`yakan-glass rounded-2xl transition-all duration-200 hover:shadow-md ${topAccent} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Simple, clean, modern button matching reference portal style.
 */
export const MagneticButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    className?: string;
    variant?: 'crimson' | 'sapphire' | 'glass';
  }
> = ({ children, className = '', variant = 'crimson', ...props }) => {
  const variantClasses =
    variant === 'crimson'
      ? 'btn-3d-crimson px-5 py-3 rounded-xl font-semibold text-sm gap-2'
      : variant === 'sapphire'
      ? 'btn-3d-sapphire px-5 py-3 rounded-xl font-semibold text-sm gap-2'
      : 'btn-3d-glass px-5 py-3 rounded-xl font-semibold text-sm gap-2';

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-[0.99] ${
        className || variantClasses
      }`}
    >
      {children}
    </button>
  );
};

/**
 * Clean, modern segmented tabs for Light & Dark mode.
 */
export const GlidingYakanTabs: React.FC<{
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: string | number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              isActive
                ? 'bg-[#B91C1C] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && Number(tab.badge) > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isActive
                    ? 'bg-white text-[#B91C1C]'
                    : 'bg-red-100 text-[#B91C1C] dark:bg-red-900/50 dark:text-red-200'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
