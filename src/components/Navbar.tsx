import React from 'react';
import {
  Flame,
  Heart,
  Zap,
  Clock,
  Volume2,
  VolumeX,
  ShieldCheck,
  Map,
  CalendarClock,
  Cpu,
  Code2,
  Terminal,
  Trophy,
} from 'lucide-react';
import type { UserProgress } from '../types/curriculum';
import { getRankInfo } from '../utils/storage';

export type AppTab = 'path' | 'daily' | 'simulators' | 'codelabs' | 'cli' | 'profile';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  progress: UserProgress;
  onToggleSound: () => void;
  onToggleSeniorMode: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'path', label: 'Skill Path', icon: <Map className="w-4 h-4" /> },
  { id: 'daily', label: 'Daily 30m', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'simulators', label: 'Simulators', icon: <Cpu className="w-4 h-4" /> },
  { id: 'codelabs', label: 'Code Labs', icon: <Code2 className="w-4 h-4" /> },
  { id: 'cli', label: 'CLI Dojo', icon: <Terminal className="w-4 h-4" /> },
  { id: 'profile', label: 'Profile', icon: <Trophy className="w-4 h-4" /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  progress,
  onToggleSound,
  onToggleSeniorMode,
}) => {
  const rank = getRankInfo(progress.xp);
  const dailyPct = Math.min(100, Math.round((progress.todayMinutes / progress.dailyGoalMinutes) * 100));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => setActiveTab('path')}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <div className="font-extrabold text-base tracking-tight text-white leading-none">
              Robo<span className="text-emerald-400">Dojo</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">
              Lvl {rank.level} · {rank.title}
            </div>
          </div>
        </button>

        {/* Navigation Pills */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Gamification HUD */}
        <div className="flex items-center gap-2.5">
          {/* Daily 30m Goal */}
          <button
            onClick={() => setActiveTab('daily')}
            title="Daily 30-minute learning goal"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-200 leading-none">
                {progress.todayMinutes}/{progress.dailyGoalMinutes}m
              </div>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
            </div>
          </button>

          {/* Streak */}
          <div
            title="Daily learning streak"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            <span className="text-xs font-extrabold text-amber-300">{progress.streakDays}</span>
          </div>

          {/* XP */}
          <div
            title="Total Experience Points"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
          >
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
            <span className="text-xs font-extrabold text-emerald-300">{progress.xp} XP</span>
          </div>

          {/* Hearts / Senior Mode */}
          <button
            onClick={onToggleSeniorMode}
            title={
              progress.seniorMode
                ? 'Senior Mode ON (Unlimited Hearts) — Click to toggle'
                : 'Hearts remaining — Click to toggle Senior Mode (Unlimited)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
              progress.seniorMode
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                : 'bg-slate-900 border-slate-800 text-rose-400 hover:border-rose-500/40'
            }`}
          >
            {progress.seniorMode ? (
              <>
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold">∞</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-xs font-extrabold">{progress.hearts}</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={progress.soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {progress.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
