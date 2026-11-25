import type { Badge, DailyQuest, UserProgress } from '../types/curriculum';

const STORAGE_KEY = 'robodojo_progress_v1';

export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streakDays: 1,
  lastActiveDate: getTodayStr(),
  todayMinutes: 0,
  dailyGoalMinutes: 30,
  hearts: 5,
  maxHearts: 5,
  seniorMode: false,
  soundEnabled: true,
  completedNodeIds: [],
  masteredNodeIds: [],
  completedCodeLabIds: [],
  completedCliChallenges: [],
  missedExerciseIds: [],
  codeDrafts: {},
  dailyQuestClaims: {},
  todayLessonsCompleted: 0,
  todayXpEarned: 0,
  todayCodeLabsCompleted: 0,
};

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, lastActiveDate: getTodayStr() };
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    let streakDays = parsed.streakDays ?? 1;
    let todayMinutes = parsed.todayMinutes ?? 0;
    let todayLessonsCompleted = parsed.todayLessonsCompleted ?? 0;
    let todayXpEarned = parsed.todayXpEarned ?? 0;
    let todayCodeLabsCompleted = parsed.todayCodeLabsCompleted ?? 0;

    if (parsed.lastActiveDate && parsed.lastActiveDate !== today) {
      // New day rollover
      todayMinutes = 0;
      todayLessonsCompleted = 0;
      todayXpEarned = 0;
      todayCodeLabsCompleted = 0;
      if (parsed.lastActiveDate === yesterday) {
        streakDays = streakDays + 1;
      } else {
        streakDays = 1;
      }
    }

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      lastActiveDate: today,
      streakDays,
      todayMinutes,
      todayLessonsCompleted,
      todayXpEarned,
      todayCodeLabsCompleted,
    };
  } catch {
    return { ...DEFAULT_PROGRESS, lastActiveDate: getTodayStr() };
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage quota errors
  }
}

export interface RankInfo {
  title: string;
  level: number;
  currentMinXp: number;
  nextLevelXp: number;
}

const RANKS: { title: string; minXp: number }[] = [
  { title: 'Node Apprentice', minXp: 0 },
  { title: 'Topic Architect', minXp: 150 },
  { title: 'QoS Strategist', minXp: 400 },
  { title: 'TF2 Tactician', minXp: 750 },
  { title: 'Control Systems Engineer', minXp: 1200 },
  { title: 'SLAM Specialist', minXp: 1800 },
  { title: 'Nav2 Navigator', minXp: 2500 },
  { title: 'MoveIt Maestro', minXp: 3400 },
  { title: 'Principal Robotics Architect', minXp: 4500 },
];

export function getRankInfo(xp: number): RankInfo {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) idx = i;
  }
  const current = RANKS[idx];
  const next = RANKS[idx + 1];
  return {
    title: current.title,
    level: idx + 1,
    currentMinXp: current.minXp,
    nextLevelXp: next ? next.minXp : current.minXp + 1000,
  };
}

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest_lesson',
    title: 'Complete 1 Skill Node',
    target: 1,
    xpBonus: 30,
    metric: 'lessons',
  },
  {
    id: 'quest_xp',
    title: 'Earn 60 XP Today',
    target: 60,
    xpBonus: 40,
    metric: 'xp',
  },
  {
    id: 'quest_30min',
    title: 'Hit 30-Min Daily Goal',
    target: 30,
    xpBonus: 75,
    metric: 'minutes',
  },
  {
    id: 'quest_codelab',
    title: 'Pass 1 Code Lab Assignment',
    target: 1,
    xpBonus: 50,
    metric: 'codelabs',
  },
];

export const BADGES: Badge[] = [
  {
    id: 'first_node',
    name: 'Hello, rclpy!',
    description: 'Completed your very first ROS 2 lesson node.',
    icon: '🚀',
    conditionText: 'Complete 1 lesson node',
  },
  {
    id: 'zero_mistake',
    name: 'Deterministic Execution',
    description: 'Mastered a lesson node with zero mistakes.',
    icon: '🎯',
    conditionText: 'Finish a lesson with 100% accuracy',
  },
  {
    id: 'code_smith',
    name: 'Production Node Author',
    description: 'Passed 3 hands-on ROS 2 Code Lab assignments.',
    icon: '💻',
    conditionText: 'Pass 3 Code Labs',
  },
  {
    id: 'cli_ninja',
    name: 'DDS Graph Inspector',
    description: 'Completed 4 CLI Dojo diagnostic challenges.',
    icon: '⌨️',
    conditionText: 'Complete 4 CLI challenges',
  },
  {
    id: 'daily_warrior',
    name: '30-Minute Discipline',
    description: 'Reached your 30-minute daily learning goal.',
    icon: '⏱️',
    conditionText: 'Log 30+ minutes in a day',
  },
  {
    id: 'unit_1_clear',
    name: 'DDS & Executor Master',
    description: 'Cleared all nodes in Unit 1.',
    icon: '🧠',
    conditionText: 'Complete Unit 1',
  },
  {
    id: 'xp_500',
    name: 'Senior Roboticist',
    description: 'Accumulated 500+ XP across lessons and labs.',
    icon: '⚡',
    conditionText: 'Reach 500 XP',
  },
  {
    id: 'streak_3',
    name: 'Steady Cadence',
    description: 'Maintained a 3-day learning streak.',
    icon: '🔥',
    conditionText: '3-day streak',
  },
];

export function getUnlockedBadgeIds(progress: UserProgress): string[] {
  const unlocked: string[] = [];
  if (progress.completedNodeIds.length >= 1) unlocked.push('first_node');
  if (progress.masteredNodeIds.length >= 1) unlocked.push('zero_mistake');
  if (progress.completedCodeLabIds.length >= 3) unlocked.push('code_smith');
  if (progress.completedCliChallenges.length >= 4) unlocked.push('cli_ninja');
  if (progress.todayMinutes >= 30) unlocked.push('daily_warrior');
  if (
    ['u1_n1', 'u1_n2', 'u1_n3', 'u1_n4'].every((id) =>
      progress.completedNodeIds.includes(id)
    )
  ) {
    unlocked.push('unit_1_clear');
  }
  if (progress.xp >= 500) unlocked.push('xp_500');
  if (progress.streakDays >= 3) unlocked.push('streak_3');
  return unlocked;
}
