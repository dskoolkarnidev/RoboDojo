import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Cpu,
  Code2,
  Terminal,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getAllNodes } from '../data/curriculum';
import { CODE_LABS } from '../data/codeLabs';
import type { LessonNode, UserProgress } from '../types/curriculum';

interface DailySessionProps {
  progress: UserProgress;
  onStartNode: (node: LessonNode) => void;
  onOpenSim: (tab: 'diffdrive' | 'qos' | 'tf2' | 'pid') => void;
  onOpenCodeLab: (labId: string) => void;
  onOpenCli: () => void;
  onLogMinutes: (mins: number) => void;
}

export const DailySession: React.FC<DailySessionProps> = ({
  progress,
  onStartNode,
  onOpenSim,
  onOpenCodeLab,
  onOpenCli,
  onLogMinutes,
}) => {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [accumulatedSecs, setAccumulatedSecs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setAccumulatedSecs((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          onLogMinutes(1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, onLogMinutes]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const allNodes = getAllNodes();
  const nextNode =
    allNodes.find((n) => !progress.completedNodeIds.includes(n.id)) ?? allNodes[0];
  const nextLab =
    CODE_LABS.find((l) => !progress.completedCodeLabIds.includes(l.id)) ?? CODE_LABS[0];

  const pct = Math.min(
    100,
    Math.round((progress.todayMinutes / progress.dailyGoalMinutes) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header + Live 30m Timer */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              GUIDED 30-MINUTE DAILY PLAN
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Today&apos;s Robotics &amp; ROS 2 Session
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Tailored for C++ &amp; Python developers new to robotics: 10 minutes of
              first-principles robotics + rclcpp depth, 10 minutes in the simulators/CLI, and 10
              minutes of hands-on ROS 2 node coding.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-300">
                {progress.todayMinutes} / {progress.dailyGoalMinutes} min logged today ({pct}%)
              </span>
            </div>
          </div>

          {/* Timer Widget */}
          <div className="shrink-0 rounded-2xl bg-slate-950/90 border border-slate-800 p-4 text-center min-w-[210px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Session Timer
            </div>
            <div className="text-4xl font-mono font-extrabold text-white my-2 tracking-tight">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                  running
                    ? 'bg-amber-500 text-slate-950 shadow-[0_3px_0_0_#b45309]'
                    : 'bg-emerald-500 text-slate-950 shadow-[0_3px_0_0_#047857]'
                }`}
              >
                {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {running ? 'Pause' : 'Start Timer'}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(30 * 60);
                  setAccumulatedSecs(0);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Reset 30:00 timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              {accumulatedSecs > 0 && running
                ? `Active (${60 - accumulatedSecs}s to next +1m)`
                : 'Lessons & labs also log minutes automatically'}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Block Daily Workout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Block 1: 10m Concept */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-bold">
                Part 1 · ~10 min
              </span>
              {progress.completedNodeIds.includes(nextNode.id) && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-white">{nextNode.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{nextNode.subtitle}</p>
          </div>

          <button
            onClick={() => onStartNode(nextNode)}
            className="btn-3d w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-[0_3px_0_0_#047857] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Launch Lesson (+{nextNode.xpReward} XP)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Block 2: 10m Simulator / CLI */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-bold">
                Part 2 · ~10 min
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Interactive Sim &amp; CLI Inspection
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experiment with live QoS compatibility, TF2 frame matrices, PID tuning, or debug a
              live robot graph in the CLI Dojo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenSim(nextNode.linkedSimTab ?? 'qos')}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" /> Simulators
            </button>
            <button
              onClick={onOpenCli}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" /> CLI Dojo
            </button>
          </div>
        </div>

        {/* Block 3: 10m Code Assignment */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 text-xs font-bold">
                Part 3 · ~10 min
              </span>
              {progress.completedCodeLabIds.includes(nextLab.id) && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-white">{nextLab.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{nextLab.brief}</p>
          </div>

          <button
            onClick={() => onOpenCodeLab(nextLab.id)}
            className="btn-3d w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs shadow-[0_3px_0_0_#6d28d9] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Open Code Assignment (+{nextLab.xpReward} XP)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
