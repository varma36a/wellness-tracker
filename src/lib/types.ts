export type MoodEntry = {
  id: string;
  user_id: string;
  mood_score: number;
  emotions: string[];
  behavior_notes: string | null;
  triggers: string | null;
  energy_level: number | null;
  sleep_hours: number | null;
  entry_date: string;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  user_id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type ChecklistLog = {
  id: string;
  user_id: string;
  item_id: string;
  log_date: string;
  completed: boolean;
  created_at: string;
};

export type Reflection = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood_at_writing: number | null;
  tags: string[];
  reflection_date: string;
  created_at: string;
  updated_at: string;
};

export type JournalEvent = {
  id: string;
  user_id: string;
  title: string;
  event_description: string;
  emotional_response: string | null;
  old_programming: string | null;
  new_programming: string | null;
  practice_note: string | null;
  trigger_intensity: number | null;
  event_type: string;
  tags: string[];
  event_date: string;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  user_id: string;
  pin_hash: string | null;
  pin_enabled: boolean;
  updated_at: string;
};

export const PIN_LENGTH = 4;

export const EVENT_TYPES = [
  { value: "trigger", label: "Trigger", description: "Something activated an old pattern" },
  { value: "breakthrough", label: "Breakthrough", description: "A new insight or shift" },
  { value: "pattern", label: "Recurring pattern", description: "A habit or loop you noticed" },
  { value: "dream", label: "Dream / subconscious", description: "Symbols or messages from sleep" },
  { value: "interaction", label: "Interaction", description: "Event with another person" },
  { value: "inner_dialogue", label: "Inner dialogue", description: "Self-talk or internal narrative" },
] as const;

export const SUBCONSCIOUS_PROMPTS = {
  event: [
    "What exactly happened?",
    "Where were you and who was involved?",
    "What was the turning point in this moment?",
  ],
  old: [
    "What automatic thought showed up?",
    "What old belief did this activate?",
    "What story did your mind tell you?",
    "What did you assume about yourself or others?",
  ],
  new: [
    "What is a more empowering reframe?",
    "What would you tell a close friend in this situation?",
    "What new belief do you want to install?",
    "What evidence contradicts the old programming?",
  ],
  practice: [
    "Affirmation to repeat daily",
    "Visualization or meditation practice",
    "One small action to reinforce the new pattern",
  ],
};

export const EMOTION_OPTIONS = [
  "Calm",
  "Happy",
  "Grateful",
  "Energetic",
  "Focused",
  "Anxious",
  "Sad",
  "Angry",
  "Overwhelmed",
  "Lonely",
  "Restless",
  "Tired",
  "Hopeful",
  "Motivated",
  "Stressed",
] as const;

export const REFLECTION_PROMPTS = [
  "What went well today?",
  "What challenged you?",
  "What are you grateful for?",
  "What would you do differently?",
  "How did your body feel today?",
  "What pattern do you notice?",
];

export const DEFAULT_CHECKLIST_ITEMS = [
  "Drink enough water",
  "Move your body",
  "Eat nourishing meals",
  "Take breaks from screens",
  "Practice mindfulness",
  "Connect with someone",
  "Get enough sleep",
];
