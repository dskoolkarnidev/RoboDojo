import React from 'react';
import {
  Trophy,
  Flame,
  Zap,
  ShieldCheck,
  Download,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import type { UserProgress } from '../types/curriculum';
import { BADGES, getRankInfo, getUnlockedBadgeIds } from '../utils/storage';
import { getAllNodes } from '../data/curriculum';
import { CODE_LABS } from '../data/codeLabs';

interface ProfileViewProps {
  progress: UserProgress;
  onToggleSeniorMode: () => void;
  onResetProgress: () => void;
  onReviewNode: (nodeId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  progress,
  onToggleSeniorMode,
  onResetProgress,
  onReviewNode,
}) => {
  const rank = getRankInfo(progress.xp);
  const unlockedBadges = getUnlockedBadgeIds(progress);
  const allNodes = getAllNodes();

  const xpRange = Math.max(1, rank.nextLevelXp - rank.currentMinXp);
  const xpPct = Math.min(100, Math.round(((progress.xp - rank.currentMinXp) / xpRange) * 100));

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robodojo-progress-${progress.lastActiveDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Rank & Stats Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Level {rank.level} Roboticist
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              {rank.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button
              onClick={onResetProgress}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* XP Progress to next rank */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">Progress to Level {rank.level + 1}</span>
            <span className="text-emerald-400">
              {progress.xp} / {rank.nextLevelXp} XP
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Total XP
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">{progress.xp}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Streak
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">{progress.streakDays}d</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Nodes Cleared</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {progress.completedNodeIds.length}/{allNodes.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Code Labs Passed</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {progress.completedCodeLabIds.length}/{CODE_LABS.length}
            </div>
          </div>
        </div>

        {/* Senior Mode Toggle */}
        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Senior Engineer Mode</div>
              <div className="text-xs text-slate-400">
                Grants unlimited hearts and unlocks all curriculum units immediately so you can
                jump straight to TF2, Nav2, or MoveIt 2.
              </div>
            </div>
          </div>
          <button
            onClick={onToggleSeniorMode}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 ${
              progress.seniorMode
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {progress.seniorMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Badges Gallery */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Achievements ({unlockedBadges.length}/{BADGES.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const unlocked = unlockedBadges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-slate-950 border-amber-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-50'
                }`}
              >
                <div className="text-2xl mb-2">{b.icon}</div>
                <div className="text-sm font-bold text-white">{b.name}</div>
                <div className="text-xs text-slate-400 mt-1">{b.description}</div>
                <div className="text-[11px] font-semibold text-amber-400 mt-2">
                  {unlocked ? '✓ Unlocked' : `Goal: ${b.conditionText}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Review Nodes */}
      {progress.completedNodeIds.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Completed Nodes (Spaced Review)
          </h2>
          <div className="flex flex-wrap gap-2">
            {progress.completedNodeIds.map((nid) => {
              const node = allNodes.find((n) => n.id === nid);
              if (!node) return null;
              return (
                <button
                  key={nid}
                  onClick={() => onReviewNode(nid)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                >
                  ↻ {node.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
