import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Zap,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Cpu,
} from 'lucide-react';
import type { Exercise, LessonNode } from '../types/curriculum';
import { playSound } from '../utils/sound';

interface LessonPlayerProps {
  node: LessonNode;
  hearts: number;
  seniorMode: boolean;
  soundEnabled: boolean;
  onLoseHeart: () => void;
  onRecordMiss: (exerciseId: string) => void;
  onComplete: (xpEarned: number, mistakes: number, minutesSpent: number) => void;
  onClose: () => void;
}

function getExerciseBadge(type: Exercise['type']) {
  switch (type) {
    case 'spot-the-bug':
      return { label: '🐛 Spot the Bug', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    case 'code-fill':
      return { label: '🧩 Code Completion', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    case 'sequence-order':
      return { label: '🔀 Order the Pipeline', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' };
    case 'architecture-tradeoff':
      return { label: '🏗️ Architecture Trade-off', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    default:
      return { label: '⚡ Concept Check', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  }
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  node,
  hearts,
  seniorMode,
  soundEnabled,
  onLoseHeart,
  onRecordMiss,
  onComplete,
  onClose,
}) => {
  // Phase: 'study' (deep-dive interactive cards) -> 'quiz' (exercises) -> 'done'
  const [phase, setPhase] = useState<'study' | 'quiz' | 'done'>('study');
  const [studyIdx, setStudyIdx] = useState<number>(0);

  const [step, setStep] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [orderList, setOrderList] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [startTime] = useState<number>(() => Date.now());

  const totalStudy = node.deepDive?.length ?? 0;
  const totalQuiz = node.exercises.length;
  const currentExercise: Exercise | undefined =
    phase === 'quiz' && step >= 0 && step < totalQuiz ? node.exercises[step] : undefined;

  const initStep = (nextStep: number) => {
    setStep(nextStep);
    setSelectedOption(null);
    setChecked(false);
    setIsCorrect(false);
    const ex = node.exercises[nextStep];
    if (ex?.type === 'sequence-order') {
      const copy = [...ex.options];
      if (copy.length >= 2) {
        [copy[0], copy[copy.length - 1]] = [copy[copy.length - 1], copy[0]];
      }
      setOrderList(copy);
    } else {
      setOrderList([]);
    }
  };

  const startQuiz = () => {
    playSound('click', soundEnabled);
    setPhase('quiz');
    initStep(0);
  };

  const handleCheck = () => {
    if (!currentExercise) return;
    let ok = false;

    if (currentExercise.type === 'sequence-order') {
      ok =
        JSON.stringify(orderList) ===
        JSON.stringify(currentExercise.correctOrder ?? currentExercise.options);
    } else {
      ok = selectedOption === currentExercise.correctIndex;
    }

    setChecked(true);
    setIsCorrect(ok);

    if (ok) {
      playSound('correct', soundEnabled);
      setCombo((c) => c + 1);
    } else {
      playSound('wrong', soundEnabled);
      setMistakes((m) => m + 1);
      setCombo(0);
      onRecordMiss(currentExercise.id);
      if (!seniorMode) {
        onLoseHeart();
      }
    }
  };

  const handleNext = () => {
    if (step + 1 < totalQuiz) {
      initStep(step + 1);
    } else {
      playSound('complete', soundEnabled);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setPhase('done');
    }
  };

  const moveOrderItem = (idx: number, dir: -1 | 1) => {
    if (checked) return;
    const target = idx + dir;
    if (target < 0 || target >= orderList.length) return;
    const next = [...orderList];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrderList(next);
  };

  const elapsedMinutes = Math.max(
    1,
    Math.round((Date.now() - startTime) / 60000) || node.estimatedMinutes
  );

  if (!seniorMode && hearts <= 0 && phase !== 'done') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b1120]/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-rose-500/40 p-6 text-center space-y-4 shadow-2xl">
          <Heart className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-white">Out of Hearts!</h2>
          <p className="text-sm text-slate-400">
            Enable <span className="text-violet-300 font-bold">Senior Mode (Unlimited Hearts)</span>{' '}
            in the top bar if you prefer uninterrupted study, or exit to recharge.
          </p>
          <button
            onClick={onClose}
            className="btn-3d w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
          >
            Return to Skill Path
          </button>
        </div>
      </div>
    );
  }

  const totalSteps = Math.max(1, totalStudy + totalQuiz);
  const completedSteps =
    phase === 'study'
      ? studyIdx + 1
      : phase === 'quiz'
      ? totalStudy + step + (checked ? 1 : 0)
      : totalSteps;
  const progressPct = Math.min(100, Math.round((completedSteps / totalSteps) * 100));

  const currentSection = node.deepDive?.[studyIdx];

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1120] flex flex-col">
      {/* Top Progress Bar */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Exit lesson"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 h-3.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {combo >= 2 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold">
              {combo}x Combo
            </span>
          )}

          <div className="flex items-center gap-1.5 text-sm font-bold">
            {seniorMode ? (
              <span className="flex items-center gap-1 text-violet-300">
                <ShieldCheck className="w-5 h-5" /> ∞
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" /> {hearts}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* STUDY PHASE: Deep-Dive First Principles Cards */}
          {phase === 'study' && currentSection && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  In-Depth Study · Card {studyIdx + 1} of {totalStudy}
                </div>
                <button
                  onClick={startQuiz}
                  className="text-xs font-bold text-slate-400 hover:text-cyan-300 cursor-pointer"
                >
                  Skip to Challenges →
                </button>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {node.title}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  {currentSection.title}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {currentSection.body}
              </p>

              {currentSection.cppBridge && (
                <div className="rounded-xl bg-violet-950/35 border border-violet-500/35 p-4 flex items-start gap-3">
                  <Cpu className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-violet-300">
                      C++ Systems Mental Bridge
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                      {currentSection.cppBridge}
                    </p>
                  </div>
                </div>
              )}

              {currentSection.code && (
                <pre className="rounded-xl bg-[#070b14] border border-slate-800 p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-200 leading-relaxed shadow-inner">
                  <code>{currentSection.code}</code>
                </pre>
              )}

              {/* Key Takeaways shown on final study card */}
              {studyIdx === totalStudy - 1 && (
                <div className="space-y-2.5 bg-slate-950/70 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Summary Takeaways
                  </div>
                  {node.keyTakeaways.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <span className="text-emerald-400 font-bold">▸</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  disabled={studyIdx === 0}
                  onClick={() => setStudyIdx((i) => Math.max(0, i - 1))}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>

                {studyIdx + 1 < totalStudy ? (
                  <button
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setStudyIdx((i) => i + 1);
                    }}
                    className="btn-3d px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-[0_4px_0_0_#0e7490] flex items-center gap-2 cursor-pointer"
                  >
                    Next Concept <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={startQuiz}
                    className="btn-3d px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-[0_4px_0_0_#047857] flex items-center gap-2 cursor-pointer"
                  >
                    Start {totalQuiz} Challenges <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* QUIZ PHASE */}
          {phase === 'quiz' && currentExercise && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    getExerciseBadge(currentExercise.type).cls
                  }`}
                >
                  {getExerciseBadge(currentExercise.type).label}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPhase('study')}
                    className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
                  >
                    Review Study Notes
                  </button>
                  <span className="text-xs font-mono text-slate-500">
                    Challenge {step + 1} of {totalQuiz}
                  </span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {currentExercise.prompt}
              </h2>

              {currentExercise.codeSnippet && (
                <pre className="rounded-xl bg-[#070b14] border border-slate-800 p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-200 leading-relaxed shadow-inner">
                  <code>{currentExercise.codeSnippet}</code>
                </pre>
              )}

              {currentExercise.type === 'sequence-order' ? (
                <div className="space-y-2.5">
                  {orderList.map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-100">{item}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveOrderItem(idx, -1)}
                          disabled={checked || idx === 0}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveOrderItem(idx, 1)}
                          disabled={checked || idx === orderList.length - 1}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentExercise.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isAnswer = idx === currentExercise.correctIndex;

                    let cardCls =
                      'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-slate-200';
                    if (checked) {
                      if (isAnswer) {
                        cardCls = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                      } else if (isSelected && !isAnswer) {
                        cardCls = 'bg-rose-500/15 border-rose-500 text-rose-200';
                      } else {
                        cardCls = 'bg-slate-900/50 border-slate-800 text-slate-500';
                      }
                    } else if (isSelected) {
                      cardCls = 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_0_1px_#22d3ee]';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={checked}
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setSelectedOption(idx);
                        }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3.5 cursor-pointer ${cardCls}`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm sm:text-base font-medium leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DONE PHASE */}
          {phase === 'done' && (
            <div className="rounded-2xl bg-slate-900 border border-emerald-500/40 p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Zap className="w-9 h-9 fill-emerald-400/30" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Node Cleared!</h2>
                <p className="text-slate-400 mt-1">{node.title}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">XP Earned</div>
                  <div className="text-xl font-extrabold text-emerald-400">
                    +{mistakes === 0 ? node.xpReward + 15 : node.xpReward}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Accuracy</div>
                  <div className="text-xl font-extrabold text-cyan-400">
                    {Math.max(0, Math.round(((totalQuiz - mistakes) / totalQuiz) * 100))}%
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Time</div>
                  <div className="text-xl font-extrabold text-amber-400">{elapsedMinutes}m</div>
                </div>
              </div>

              <button
                onClick={() =>
                  onComplete(
                    mistakes === 0 ? node.xpReward + 15 : node.xpReward,
                    mistakes,
                    elapsedMinutes
                  )
                }
                className="btn-3d w-full max-w-sm mx-auto py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base shadow-[0_4px_0_0_#047857] cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action & Explanation Footer */}
      {phase === 'quiz' && currentExercise && (
        <div
          className={`border-t px-4 py-4 transition-colors ${
            checked
              ? isCorrect
                ? 'bg-emerald-950/60 border-emerald-500/40'
                : 'bg-rose-950/60 border-rose-500/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {checked ? (
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Spot on!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span className="text-rose-300">Not quite — review this mental model:</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentExercise.explanation}
                </p>
                {currentExercise.seniorTip && (
                  <p className="text-xs text-amber-300/90 flex items-start gap-1.5 pt-1">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Senior Tip:</strong> {currentExercise.seniorTip}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Select an answer and click <strong className="text-slate-200">Check</strong>.
              </div>
            )}

            {!checked ? (
              <button
                onClick={handleCheck}
                disabled={currentExercise.type !== 'sequence-order' && selectedOption === null}
                className="btn-3d shrink-0 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-slate-950 font-extrabold text-sm shadow-[0_4px_0_0_#047857] cursor-pointer"
              >
                Check
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={`btn-3d shrink-0 px-8 py-3 rounded-xl font-extrabold text-sm cursor-pointer ${
                  isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_4px_0_0_#047857]'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_4px_0_0_#be123c]'
                }`}
              >
                {step + 1 < totalQuiz ? 'Next' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
