import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  RotateCcw,
  Code2,
  Zap,
} from 'lucide-react';
import { CODE_LABS } from '../data/codeLabs';
import type { CodeLabTask, CodeTestCase, UserProgress } from '../types/curriculum';
import { playSound } from '../utils/sound';

interface CodeLabProps {
  initialLabId?: string;
  progress: UserProgress;
  onSaveDraft: (labId: string, code: string) => void;
  onPassLab: (labId: string, xp: number, minutes: number) => void;
}

function evaluateTest(code: string, test: CodeTestCase): boolean {
  if (test.checkType === 'includes-all') {
    return test.patterns.every((p) => code.includes(p));
  }
  if (test.checkType === 'includes-any') {
    return test.patterns.some((p) => code.includes(p));
  }
  if (test.checkType === 'not-includes') {
    return test.patterns.every((p) => !code.includes(p));
  }
  if (test.checkType === 'regex') {
    return test.patterns.every((p) => new RegExp(p, 'm').test(code));
  }
  return false;
}

export const CodeLab: React.FC<CodeLabProps> = ({
  initialLabId,
  progress,
  onSaveDraft,
  onPassLab,
}) => {
  const [selectedId, setSelectedId] = useState<string>(initialLabId ?? CODE_LABS[0].id);
  const lab: CodeLabTask = CODE_LABS.find((l) => l.id === selectedId) ?? CODE_LABS[0];

  const [code, setCode] = useState<string>(
    () => progress.codeDrafts[lab.id] ?? lab.starterCode
  );
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [results, setResults] = useState<{ id: string; desc: string; passed: boolean }[] | null>(
    null
  );

  const selectLab = (nextLab: CodeLabTask) => {
    setSelectedId(nextLab.id);
    setCode(progress.codeDrafts[nextLab.id] ?? nextLab.starterCode);
    setResults(null);
    setShowHints(false);
    setShowSolution(false);
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    onSaveDraft(lab.id, val);
  };

  const handleRunTests = () => {
    const evaluated = lab.tests.map((t) => ({
      id: t.id,
      desc: t.description,
      passed: evaluateTest(code, t),
    }));
    setResults(evaluated);
    const allPassed = evaluated.every((r) => r.passed);
    if (allPassed) {
      playSound('complete', progress.soundEnabled);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      onPassLab(lab.id, lab.xpReward, lab.estimatedMinutes);
    } else {
      playSound('wrong', progress.soundEnabled);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Assignment Selector & Brief */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            ROS 2 Code Assignments
          </div>
          {CODE_LABS.map((item) => {
            const passed = progress.completedCodeLabIds.includes(item.id);
            const active = item.id === lab.id;
            return (
              <button
                key={item.id}
                onClick={() => selectLab(item)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? 'bg-violet-500/15 border-violet-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.language.toUpperCase()} · {item.difficulty} · +{item.xpReward} XP
                  </div>
                </div>
                {passed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold">
              {lab.difficulty}
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> +{lab.xpReward} XP
            </span>
          </div>

          <h2 className="text-lg font-extrabold text-white">{lab.title}</h2>
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/25 text-xs text-cyan-100 leading-relaxed">
            <strong className="text-cyan-300">Robotics Why:</strong> {lab.roboticsContext}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{lab.brief}</p>

          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Acceptance Criteria
            </div>
            {lab.requirements.map((req, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">▸</span>
                <span>{req}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setShowHints((h) => !h)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" /> {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            <button
              onClick={() => setShowSolution((s) => !s)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> {showSolution ? 'Hide Solution' : 'Reference Solution'}
            </button>
          </div>

          {showHints && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
              {lab.hints.map((h, i) => (
                <p key={i} className="text-xs text-amber-200/90">
                  💡 {h}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Editor & Test Runner */}
      <div className="lg:col-span-8 space-y-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Code2 className="w-4 h-4 text-violet-400" />
              <span>
                {lab.id}.{lab.language === 'python' ? 'py' : lab.language === 'cpp' ? 'cpp' : lab.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCodeChange(lab.starterCode)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={handleRunTests}
                className="btn-3d px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-[0_3px_0_0_#047857] flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Verification Tests
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            className="w-full h-[380px] p-4 bg-[#070b14] text-emerald-200 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-y"
          />
        </div>

        {/* Test Results */}
        {results && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Verification Suite ({results.filter((r) => r.passed).length}/{results.length} Passed)
            </div>
            {results.map((r) => (
              <div
                key={r.id}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                  r.passed
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                }`}
              >
                {r.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{r.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reference Solution */}
        {showSolution && (
          <div className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-4 space-y-2">
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Reference Production Solution
            </div>
            <pre className="p-3 rounded-xl bg-[#070b14] text-cyan-100 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{lab.solutionCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
