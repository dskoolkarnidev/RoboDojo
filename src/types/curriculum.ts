export type ExerciseType =
  | 'multiple-choice'
  | 'spot-the-bug'
  | 'code-fill'
  | 'sequence-order'
  | 'architecture-tradeoff';

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  codeSnippet?: string;
  language?: 'python' | 'cpp' | 'xml' | 'yaml' | 'bash';
  options: string[];
  /** Index of the correct option for MC / spot-the-bug / code-fill / tradeoff */
  correctIndex?: number;
  /** Ordered indices or ordered strings for sequence-order */
  correctOrder?: string[];
  explanation: string;
  seniorTip?: string;
}

export type NodeKind = 'lesson' | 'lab' | 'assignment' | 'boss';

export interface LessonNode {
  id: string;
  unitId: string;
  title: string;
  subtitle: string;
  kind: NodeKind;
  estimatedMinutes: number;
  xpReward: number;
  keyTakeaways: string[];
  exercises: Exercise[];
  /** Optional link to a specific simulator or code lab id */
  linkedLabId?: string;
  linkedSimTab?: 'qos' | 'tf2' | 'pid';
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  description: string;
  color: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'cyan';
  badgeName: string;
  nodes: LessonNode[];
}

export interface CodeTestCase {
  id: string;
  description: string;
  /** Pattern or custom check key */
  checkType: 'includes-all' | 'includes-any' | 'regex' | 'not-includes';
  patterns: string[];
}

export interface CodeLabTask {
  id: string;
  unitId: string;
  title: string;
  difficulty: 'Intermediate' | 'Advanced' | 'Principal';
  estimatedMinutes: number;
  xpReward: number;
  language: 'python' | 'cpp' | 'xml' | 'yaml';
  brief: string;
  requirements: string[];
  starterCode: string;
  solutionCode: string;
  hints: string[];
  tests: CodeTestCase[];
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  xpBonus: number;
  metric: 'lessons' | 'xp' | 'minutes' | 'codelabs';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionText: string;
}

export interface UserProgress {
  xp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayMinutes: number;
  dailyGoalMinutes: number;
  hearts: number;
  maxHearts: number;
  seniorMode: boolean; // Unlimited hearts for experienced devs who don't want lockout
  soundEnabled: boolean;
  completedNodeIds: string[];
  masteredNodeIds: string[];
  completedCodeLabIds: string[];
  completedCliChallenges: string[];
  missedExerciseIds: string[]; // Spaced repetition review queue
  codeDrafts: Record<string, string>;
  dailyQuestClaims: Record<string, string>; // questId -> YYYY-MM-DD
  todayLessonsCompleted: number;
  todayXpEarned: number;
  todayCodeLabsCompleted: number;
}
