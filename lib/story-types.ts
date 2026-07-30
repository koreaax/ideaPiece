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
  { value: '양치하기 싫어함', label: '양치하기 싫어함', emoji: '🪥' },
  { value: '놀이터 미끄럼틀', label: '놀이터 미끄럼틀', emoji: '🛝' },
  { value: '밥 안 먹기', label: '밥 안 먹기', emoji: '🍚' },
  { value: '동생과 장난감 다툼', label: '장난감 다툼', emoji: '🧸' },
  { value: '낮잠 안 자기', label: '낮잠 안 자기', emoji: '😴' },
  { value: '유치원 첫 등원', label: '유치원 첫 등원', emoji: '🎒' },
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
