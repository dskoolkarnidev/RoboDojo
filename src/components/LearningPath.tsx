import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  FlaskConical,
  Code2,
  Crown,
  BookOpen,
  Clock,
  Zap,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { CURRICULUM_UNITS } from '../data/curriculum';
import type { LessonNode, Unit, UserProgress } from '../types/curriculum';
import { DAILY_QUESTS } from '../utils/storage';

interface LearningPathProps {
  progress: UserProgress;
  onStartNode: (node: LessonNode) => void;
  onOpenSim: (tab: 'qos' | 'tf2' | 'pid') => void;
  onOpenCodeLab: (labId: string) => void;
  onOpenDaily: () => void;
  onClaimQuest: (questId: string, bonus: number) => void;
}

const COLOR_MAP: Record<
  Unit['color'],
  {
    banner: string;
    border: string;
    pill: string;
    btn: string;
    ring: string;
  }
> = {
  emerald: {
    banner: 'from-emerald-600/90 to-teal-700/90',
    border: 'border-emerald-500/40',
    pill: 'bg-emerald-500/20 text-emerald-300',
    btn: 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_4px_0_0_#047857] text-slate-950',
    ring: 'ring-emerald-400/50',
  },
  sky: {
    banner: 'from-sky-600/90 to-blue-700/90',
    border: 'border-sky-500/40',
    pill: 'bg-sky-500/20 text-sky-300',
    btn: 'bg-sky-500 hover:bg-sky-400 shadow-[0_4px_0_0_#0369a1] text-slate-950',
    ring: 'ring-sky-400/50',
  },
  violet: {
    banner: 'from-violet-600/90 to-purple-700/90',
    border: 'border-violet-500/40',
    pill: 'bg-violet-500/20 text-violet-300',
    btn: 'bg-violet-500 hover:bg-violet-400 shadow-[0_4px_0_0_#6d28d9] text-white',
    ring: 'ring-violet-400/50',
  },
  amber: {
    banner: 'from-amber-600/90 to-orange-700/90',
    border: 'border-amber-500/40',
    pill: 'bg-amber-500/20 text-amber-300',
    btn: 'bg-amber-500 hover:bg-amber-400 shadow-[0_4px_0_0_#b45309] text-slate-950',
    ring: 'ring-amber-400/50',
  },
  rose: {
    banner: 'from-rose-600/90 to-pink-700/90',
    border: 'border-rose-500/40',
    pill: 'bg-rose-500/20 text-rose-300',
    btn: 'bg-rose-500 hover:bg-rose-400 shadow-[0_4px_0_0_#be123c] text-white',
    ring: 'ring-rose-400/50',
  },
  cyan: {
    banner: 'from-cyan-600/90 to-blue-700/90',
    border: 'border-cyan-500/40',
    pill: 'bg-cyan-500/20 text-cyan-300',
    btn: 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_4px_0_0_#0e7490] text-slate-950',
    ring: 'ring-cyan-400/50',
  },
};

function getNodeIcon(kind: LessonNode['kind']) {
  switch (kind) {
    case 'lab':
      return <FlaskConical className="w-6 h-6" />;
    case 'assignment':
      return <Code2 className="w-6 h-6" />;
    case 'boss':
      return <Crown className="w-6 h-6" />;
    default:
      return <BookOpen className="w-6 h-6" />;
  }
}

export const LearningPath: React.FC<LearningPathProps> = ({
  progress,
  onStartNode,
  onOpenSim,
  onOpenCodeLab,
  onOpenDaily,
  onClaimQuest,
}) => {
  const [selectedNode, setSelectedNode] = useState<LessonNode | null>(
    CURRICULUM_UNITS[0].nodes[0]
  );

  // Determine the first uncompleted node as the "current" node
  const allNodes = CURRICULUM_UNITS.flatMap((u) => u.nodes);
  const firstUncompleted = allNodes.find((n) => !progress.completedNodeIds.includes(n.id));
  const currentNodeId = firstUncompleted?.id ?? allNodes[allNodes.length - 1].id;

  const today = progress.lastActiveDate;

  const getQuestMetricValue = (metric: 'lessons' | 'xp' | 'minutes' | 'codelabs') => {
    switch (metric) {
      case 'lessons':
        return progress.todayLessonsCompleted;
      case 'xp':
        return progress.todayXpEarned;
      case 'minutes':
        return progress.todayMinutes;
      case 'codelabs':
        return progress.todayCodeLabsCompleted;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left/Main Column: Winding Skill Path */}
      <div className="lg:col-span-8 space-y-8">
        {/* Hero Daily 30m Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                DAILY 30-MIN ROBOTICS WORKOUT
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Steady, senior-paced ROS 2 mastery
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                10m architecture &amp; edge cases + 10m live simulator/CLI + 10m hands-on node coding.
              </p>
            </div>
            <button
              onClick={onOpenDaily}
              className="btn-3d shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-[0_4px_0_0_#047857] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Today&apos;s 30m
            </button>
          </div>
        </div>

        {/* Units & Winding Nodes */}
        {CURRICULUM_UNITS.map((unit) => {
          const theme = COLOR_MAP[unit.color];
          const completedInUnit = unit.nodes.filter((n) =>
            progress.completedNodeIds.includes(n.id)
          ).length;

          return (
            <section key={unit.id} className="space-y-6">
              {/* Unit Header Banner */}
              <div
                className={`rounded-2xl bg-gradient-to-r ${theme.banner} p-5 border ${theme.border} shadow-lg`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white/80">
                      Unit {unit.number} · {completedInUnit}/{unit.nodes.length} Completed
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">{unit.title}</h2>
                    <p className="text-sm text-white/85 mt-1 max-w-2xl">{unit.description}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-[11px] font-semibold text-white/80">Unit Badge</span>
                    <span className="mt-1 px-2.5 py-1 rounded-lg bg-black/25 text-xs font-bold text-white border border-white/15">
                      {unit.badgeName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Winding Node Path */}
              <div className="relative flex flex-col items-center py-2 space-y-6">
                {unit.nodes.map((node, idx) => {
                  const isCompleted = progress.completedNodeIds.includes(node.id);
                  const isMastered = progress.masteredNodeIds.includes(node.id);
                  const isCurrent = node.id === currentNodeId;
                  // Allow experienced developers to jump ahead to any Unit 1 node or any node if Senior Mode is on,
                  // otherwise unlock sequentially + current
                  const isUnlocked =
                    isCompleted || isCurrent || progress.seniorMode || unit.number === 1;

                  // Subtle horizontal sine-like offset for Duolingo feel
                  const offsets = ['translate-x-0', 'translate-x-10', 'translate-x-0', '-translate-x-10'];
                  const offsetClass = offsets[idx % offsets.length];
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      className={`relative flex flex-col items-center ${offsetClass}`}
                    >
                      <button
                        onClick={() => setSelectedNode(node)}
                        className={`btn-3d relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 text-slate-950 shadow-[0_6px_0_0_#047857]'
                            : isCurrent
                            ? `${theme.btn} node-active-pulse`
                            : isUnlocked
                            ? 'bg-slate-800 text-slate-200 border-2 border-slate-600 shadow-[0_6px_0_0_#1e293b] hover:bg-slate-700'
                            : 'bg-slate-900 text-slate-600 border-2 border-slate-800 shadow-[0_6px_0_0_#0f172a]'
                        } ${isSelected ? `ring-4 ${theme.ring}` : ''}`}
                        title={node.title}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                        ) : !isUnlocked ? (
                          <Lock className="w-6 h-6" />
                        ) : (
                          getNodeIcon(node.kind)
                        )}

                        {isMastered && (
                          <span
                            title="Mastered (0 mistakes)"
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow"
                          >
                            ★
                          </span>
                        )}
                      </button>

                      <div className="mt-2.5 text-center max-w-[200px]">
                        <div className="text-xs font-bold text-slate-200 leading-snug">
                          {node.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2 mt-0.5">
                          <span className="uppercase font-semibold text-slate-500">{node.kind}</span>
                          <span>·</span>
                          <span>{node.estimatedMinutes}m</span>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">+{node.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Right Sidebar: Selected Node Inspector + Daily Quests */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="sticky top-20 space-y-5">
          {/* Selected Node Card */}
          {selectedNode && (
            <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wide">
                  {selectedNode.kind}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> ~{selectedNode.estimatedMinutes} min
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-white">{selectedNode.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedNode.subtitle}</p>

              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  What you&apos;ll master
                </div>
                <ul className="space-y-1.5">
                  {selectedNode.keyTakeaways.map((t, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-400 mt-0.5">▸</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => onStartNode(selectedNode)}
                  className="btn-3d w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-[0_4px_0_0_#047857] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {progress.completedNodeIds.includes(selectedNode.id) ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Practice Again (+{Math.round(selectedNode.xpReward / 2)} XP)
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Start Lesson (+{selectedNode.xpReward} XP)
                    </>
                  )}
                </button>

                {selectedNode.linkedSimTab && (
                  <button
                    onClick={() => onOpenSim(selectedNode.linkedSimTab!)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Open Interactive {selectedNode.linkedSimTab.toUpperCase()} Simulator
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {selectedNode.linkedLabId && (
                  <button
                    onClick={() => onOpenCodeLab(selectedNode.linkedLabId!)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-violet-300 font-bold text-xs border border-violet-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Code2 className="w-4 h-4" />
                    Open Paired Code Lab Assignment
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Daily Quests */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Daily Quests
              </h3>
              <span className="text-xs text-slate-400">Resets daily</span>
            </div>

            <div className="space-y-3">
              {DAILY_QUESTS.map((q) => {
                const val = getQuestMetricValue(q.metric);
                const pct = Math.min(100, Math.round((val / q.target) * 100));
                const done = val >= q.target;
                const claimed = progress.dailyQuestClaims[q.id] === today;

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">{q.title}</span>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> +{q.xpBonus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            done ? 'bg-emerald-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {Math.min(val, q.target)}/{q.target}
                      </span>
                    </div>
                    {done && !claimed && (
                      <button
                        onClick={() => onClaimQuest(q.id, q.xpBonus)}
                        className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer transition-colors"
                      >
                        Claim +{q.xpBonus} XP Bonus
                      </button>
                    )}
                    {claimed && (
                      <div className="text-[11px] font-bold text-emerald-400">✓ Claimed today</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
