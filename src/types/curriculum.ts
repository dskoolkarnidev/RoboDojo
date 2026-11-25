export type ExerciseType =
  | 'multiple-choice'
  | 'spot-the-bug'
  | 'code-fill'
  | 'sequence-order'
  | 'architecture-tradeoff';

export interface DeepDiveSection {
  title: string;
  body: string;
  /** Connects a robotics concept to a familiar C++ / systems engineering concept */
  cppBridge?: string;
  code?: string;
  language?: 'cpp' | 'cmake' | 'xml' | 'yaml' | 'bash';
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  codeSnippet?: string;
  language?: 'cpp' | 'cmake' | 'python' | 'xml' | 'yaml' | 'bash';
  options: string[];
  correctIndex?: number;
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
  deepDive: DeepDiveSection[];
  exercises: Exercise[];
  linkedLabId?: string;
  linkedSimTab?: 'qos' | 'tf2' | 'pid' | 'diffdrive';
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
  language: 'cpp' | 'python' | 'cmake' | 'xml' | 'yaml';
  brief: string;
  roboticsContext: string;
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
  seniorMode: boolean;
  soundEnabled: boolean;
  completedNodeIds: string[];
  masteredNodeIds: string[];
  completedCodeLabIds: string[];
  completedCliChallenges: string[];
  missedExerciseIds: string[];
  codeDrafts: Record<string, string>;
  dailyQuestClaims: Record<string, string>;
  todayLessonsCompleted: number;
  todayXpEarned: number;
  todayCodeLabsCompleted: number;
}
