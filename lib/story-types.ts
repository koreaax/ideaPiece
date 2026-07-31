export type LlmProvider = 'auto' | 'openai' | 'gemini';
export type StoryStyle = 'playful' | 'calm' | 'cozy';

export type GenerationSettings = {
  provider: LlmProvider;
  model: string;
  temperature: number;
  style: StoryStyle;
};

export type StoryScene = {
  page: number;
  text: string;
  bg_tag: string;
};

export type StoryChoice = {
  choice_id: string;
  button_text: string;
  next_scene_trigger: string;
};

export type StoryPayload = {
  story_id: string;
  child_name: string;
  scenes: StoryScene[];
  interact_choices: StoryChoice[];
};

export type ContinuationPayload = {
  story_id: string;
  child_name: string;
  continuation_scenes: StoryScene[];
  ending_message: string;
};

export type TopicOption = {
  value: string;
  label: string;
  emoji: string;
};

export const TOPIC_OPTIONS: TopicOption[] = [
  { value: '양치하기 싫어요', label: '양치하기 싫어요', emoji: '🪥' },
  { value: '미끄럼틀 놀이', label: '미끄럼틀 놀이', emoji: '🛝' },
  { value: '밥 먹기 싫어요', label: '밥 먹기 싫어요', emoji: '🍚' },
  { value: '장난감을 양보해요', label: '장난감을 양보해요', emoji: '🧸' },
  { value: '낮잠이 싫어요', label: '낮잠이 싫어요', emoji: '😴' },
  { value: '첫 유치원 등원', label: '첫 유치원 등원', emoji: '🎒' },
];

export const STYLE_LABELS: Record<StoryStyle, string> = {
  playful: '통통 튀는 모험형',
  calm: '차분한 공감형',
  cozy: '포근한 위로형',
};

export const DEFAULT_SETTINGS: GenerationSettings = {
  provider: 'auto',
  model: '',
  temperature: 0.65,
  style: 'playful',
};
