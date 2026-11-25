import { useCallback, useEffect, useState } from 'react';
import { Navbar, type AppTab } from './components/Navbar';
import { LearningPath } from './components/LearningPath';
import { LessonPlayer } from './components/LessonPlayer';
import { DailySession } from './components/DailySession';
import { SimulatorsHub, type SimTab } from './components/SimulatorsHub';
import { CodeLab } from './components/CodeLab';
import { CliDojo } from './components/CliDojo';
import { ProfileView } from './components/ProfileView';
import type { LessonNode, UserProgress } from './types/curriculum';
import { getAllNodes } from './data/curriculum';
import { DEFAULT_PROGRESS, getTodayStr, loadProgress, saveProgress } from './utils/storage';

export function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<AppTab>('path');
  const [activeLesson, setActiveLesson] = useState<LessonNode | null>(null);
  const [simTab, setSimTab] = useState<SimTab>('diffdrive');
  const [selectedLabId, setSelectedLabId] = useState<string | undefined>(undefined);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleToggleSound = () => {
    setProgress((p) => ({ ...p, soundEnabled: !p.soundEnabled }));
  };

  const handleToggleSeniorMode = () => {
    setProgress((p) => ({
      ...p,
      seniorMode: !p.seniorMode,
      hearts: p.maxHearts,
    }));
  };

  const handleLoseHeart = () => {
    setProgress((p) => ({ ...p, hearts: Math.max(0, p.hearts - 1) }));
  };

  const handleRecordMiss = (exerciseId: string) => {
    setProgress((p) => ({
      ...p,
      missedExerciseIds: p.missedExerciseIds.includes(exerciseId)
        ? p.missedExerciseIds
        : [...p.missedExerciseIds, exerciseId],
    }));
  };

  const handleCompleteLesson = (xpEarned: number, mistakes: number, minutesSpent: number) => {
    if (!activeLesson) return;
    const nodeId = activeLesson.id;
    setProgress((p) => {
      const alreadyDone = p.completedNodeIds.includes(nodeId);
      const awardedXp = alreadyDone ? Math.round(xpEarned / 2) : xpEarned;
      return {
        ...p,
        xp: p.xp + awardedXp,
        todayXpEarned: p.todayXpEarned + awardedXp,
        todayMinutes: p.todayMinutes + minutesSpent,
        todayLessonsCompleted: p.todayLessonsCompleted + 1,
        completedNodeIds: alreadyDone ? p.completedNodeIds : [...p.completedNodeIds, nodeId],
        masteredNodeIds:
          mistakes === 0 && !p.masteredNodeIds.includes(nodeId)
            ? [...p.masteredNodeIds, nodeId]
            : p.masteredNodeIds,
      };
    });
    setActiveLesson(null);
  };

  const handleClaimQuest = (questId: string, bonus: number) => {
    const today = getTodayStr();
    setProgress((p) => {
      if (p.dailyQuestClaims[questId] === today) return p;
      return {
        ...p,
        xp: p.xp + bonus,
        todayXpEarned: p.todayXpEarned + bonus,
        dailyQuestClaims: { ...p.dailyQuestClaims, [questId]: today },
      };
    });
  };

  const handleLogMinutes = useCallback((mins: number) => {
    setProgress((p) => ({ ...p, todayMinutes: p.todayMinutes + mins }));
  }, []);

  const handleSaveDraft = (labId: string, code: string) => {
    setProgress((p) => ({
      ...p,
      codeDrafts: { ...p.codeDrafts, [labId]: code },
    }));
  };

  const handlePassCodeLab = (labId: string, xp: number, minutes: number) => {
    setProgress((p) => {
      const already = p.completedCodeLabIds.includes(labId);
      const awarded = already ? 0 : xp;
      return {
        ...p,
        xp: p.xp + awarded,
        todayXpEarned: p.todayXpEarned + awarded,
        todayMinutes: p.todayMinutes + (already ? 2 : minutes),
        todayCodeLabsCompleted: already
          ? p.todayCodeLabsCompleted
          : p.todayCodeLabsCompleted + 1,
        completedCodeLabIds: already ? p.completedCodeLabIds : [...p.completedCodeLabIds, labId],
      };
    });
  };

  const handleCompleteCliChallenge = (challengeId: string, xp: number) => {
    setProgress((p) => {
      if (p.completedCliChallenges.includes(challengeId)) return p;
      return {
        ...p,
        xp: p.xp + xp,
        todayXpEarned: p.todayXpEarned + xp,
        todayMinutes: p.todayMinutes + 2,
        completedCliChallenges: [...p.completedCliChallenges, challengeId],
      };
    });
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all RoboDojo XP, streak, and completed nodes?')) {
      setProgress({ ...DEFAULT_PROGRESS, lastActiveDate: getTodayStr() });
    }
  };

  const handleReviewNode = (nodeId: string) => {
    const found = getAllNodes().find((n) => n.id === nodeId);
    if (found) setActiveLesson(found);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1120] text-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        progress={progress}
        onToggleSound={handleToggleSound}
        onToggleSeniorMode={handleToggleSeniorMode}
      />

      <main className="flex-1">
        {activeTab === 'path' && (
          <LearningPath
            progress={progress}
            onStartNode={(node) => setActiveLesson(node)}
            onOpenSim={(tab) => {
              setSimTab(tab);
              setActiveTab('simulators');
            }}
            onOpenCodeLab={(labId) => {
              setSelectedLabId(labId);
              setActiveTab('codelabs');
            }}
            onOpenDaily={() => setActiveTab('daily')}
            onClaimQuest={handleClaimQuest}
          />
        )}

        {activeTab === 'daily' && (
          <DailySession
            progress={progress}
            onStartNode={(node) => setActiveLesson(node)}
            onOpenSim={(tab) => {
              setSimTab(tab);
              setActiveTab('simulators');
            }}
            onOpenCodeLab={(labId) => {
              setSelectedLabId(labId);
              setActiveTab('codelabs');
            }}
            onOpenCli={() => setActiveTab('cli')}
            onLogMinutes={handleLogMinutes}
          />
        )}

        {activeTab === 'simulators' && <SimulatorsHub initialTab={simTab} />}

        {activeTab === 'codelabs' && (
          <CodeLab
            initialLabId={selectedLabId}
            progress={progress}
            onSaveDraft={handleSaveDraft}
            onPassLab={handlePassCodeLab}
          />
        )}

        {activeTab === 'cli' && (
          <CliDojo
            progress={progress}
            onCompleteChallenge={handleCompleteCliChallenge}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            progress={progress}
            onToggleSeniorMode={handleToggleSeniorMode}
            onResetProgress={handleResetProgress}
            onReviewNode={handleReviewNode}
          />
        )}
      </main>

      {activeLesson && (
        <LessonPlayer
          node={activeLesson}
          hearts={progress.hearts}
          seniorMode={progress.seniorMode}
          soundEnabled={progress.soundEnabled}
          onLoseHeart={handleLoseHeart}
          onRecordMiss={handleRecordMiss}
          onComplete={handleCompleteLesson}
          onClose={() => setActiveLesson(null)}
        />
      )}
    </div>
  );
}

export default App;
