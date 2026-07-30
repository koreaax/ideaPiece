import { ContinuationPayload, GenerationSettings, StoryPayload, StoryScene, StoryStyle } from './story-types';

const allowedTags = new Set([
  'room',
  'bedroom',
  'bathroom',
  'forest',
  'sea',
  'sky',
  'fantasy_room',
  'fantasy_clouds',
]);

function safeString(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeTag(value: unknown, fallback: string) {
  const tag = safeString(value, fallback);
  return allowedTags.has(tag) ? tag : fallback;
}

function normalizeScene(scene: unknown, page: number, fallbackTag: string): StoryScene {
  if (!scene || typeof scene !== 'object') {
    return {
      page,
      text: '따뜻한 모험이 이어지고 있어요.',
      bg_tag: fallbackTag,
    };
  }

  const raw = scene as Record<string, unknown>;
  return {
    page: typeof raw.page === 'number' ? raw.page : page,
    text: safeString(raw.text, '따뜻한 모험이 이어지고 있어요.'),
    bg_tag: normalizeTag(raw.bg_tag, fallbackTag),
  };
}

function styleHint(style: StoryStyle) {
  if (style === 'calm') return '차분하고 안정감 있게';
  if (style === 'cozy') return '포근하고 다정하게';
  return '리듬감 있고 신나게';
}

export function extractJsonString(rawText: string) {
  const fenced = rawText.match(/```json\\s*([\\s\\S]*?)```/i);
  if (fenced && fenced[1]) return fenced[1].trim();

  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1);
  }

  return rawText.trim();
}

export function clampTemperature(value: unknown, fallback = 0.65) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1.2) return 1.2;
  return Number(value.toFixed(2));
}

export function normalizeSettings(input: unknown): GenerationSettings {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const provider = safeString(raw.provider, 'auto');
  const style = safeString(raw.style, 'playful');

  return {
    provider: provider === 'openai' || provider === 'gemini' ? provider : 'auto',
    model: safeString(raw.model, ''),
    temperature: clampTemperature(raw.temperature, 0.65),
    style: style === 'calm' || style === 'cozy' ? style : 'playful',
  };
}

export function buildFallbackIntroStory(childName: string, topic: string, style: StoryStyle): StoryPayload {
  const name = childName.trim() || '친구';
  const mission = topic.trim() || '오늘의 작은 모험';
  const mood = styleHint(style);

  return {
    story_id: `fallback-intro-${Date.now()}`,
    child_name: name,
    scenes: [
      {
        page: 1,
        text: `${name}는 오늘 ${mission} 때문에 마음이 콩닥콩닥했어요. ${mood} 숨을 후우 내쉬며 첫 걸음을 떼었어요.`,
        bg_tag: 'room',
      },
      {
        page: 2,
        text: `그때 반짝반짝 별요정이 나타나 말했어요. "괜찮아, 천천히 해도 돼. 우리 같이 해보자!"`,
        bg_tag: 'fantasy_room',
      },
      {
        page: 3,
        text: `${name}는 고개를 끄덕였어요. 이제 어떤 길로 가볼까요?`,
        bg_tag: 'fantasy_clouds',
      },
    ],
    interact_choices: [
      {
        choice_id: 'A',
        button_text: '숲속으로 가기',
        next_scene_trigger: 'forest_path',
      },
      {
        choice_id: 'B',
        button_text: '바다로 가기',
        next_scene_trigger: 'sea_path',
      },
    ],
  };
}

export function buildFallbackContinuation(
  story: StoryPayload,
  selectedChoice: string,
  style: StoryStyle
): ContinuationPayload {
  const name = story.child_name || '친구';
  const pickedForest = selectedChoice.includes('숲');
  const mood = styleHint(style);
  const startPage = story.scenes.length + 1;

  return {
    story_id: story.story_id,
    child_name: name,
    continuation_scenes: [
      {
        page: startPage,
        text: `${name}는 ${pickedForest ? '숲길' : '바닷길'}로 발을 내디뎠어요. 사각사각, 혹은 출렁출렁 소리가 들렸어요.`,
        bg_tag: pickedForest ? 'forest' : 'sea',
      },
      {
        page: startPage + 1,
        text: `길 끝에서 만난 친구가 말했어요. "네 마음은 아주 용감해!" ${mood} 서로 하이파이브를 했어요.`,
        bg_tag: pickedForest ? 'forest' : 'sea',
      },
      {
        page: startPage + 2,
        text: `${name}는 작은 성공을 해냈어요. "다음에도 해볼래!" 하며 활짝 웃었답니다.`,
        bg_tag: 'fantasy_clouds',
      },
    ],
    ending_message: `${name}는 스스로 선택하고 끝까지 해냈어요. 오늘의 모험 대성공!`,
  };
}

export function normalizeIntroStory(input: unknown, childName: string, topic: string, style: StoryStyle): StoryPayload {
  if (!input || typeof input !== 'object') {
    return buildFallbackIntroStory(childName, topic, style);
  }

  const raw = input as Record<string, unknown>;
  const fallback = buildFallbackIntroStory(childName, topic, style);

  const scenes = asArray(raw.scenes)
    .slice(0, 3)
    .map((scene, index) => normalizeScene(scene, index + 1, index === 0 ? 'room' : 'fantasy_room'));

  const choicesRaw = asArray(raw.interact_choices).slice(0, 2);
  const choices = choicesRaw.map((choice, index) => {
    if (!choice || typeof choice !== 'object') {
      return fallback.interact_choices[index];
    }

    const value = choice as Record<string, unknown>;
    return {
      choice_id: safeString(value.choice_id, index === 0 ? 'A' : 'B'),
      button_text: safeString(value.button_text, index === 0 ? '숲속으로 가기' : '바다로 가기'),
      next_scene_trigger: safeString(value.next_scene_trigger, index === 0 ? 'forest_path' : 'sea_path'),
    };
  });

  return {
    story_id: safeString(raw.story_id, fallback.story_id),
    child_name: safeString(raw.child_name, childName || fallback.child_name),
    scenes: scenes.length === 3 ? scenes : fallback.scenes,
    interact_choices: choices.length === 2 ? choices : fallback.interact_choices,
  };
}

export function normalizeContinuation(
  input: unknown,
  story: StoryPayload,
  selectedChoice: string,
  style: StoryStyle
): ContinuationPayload {
  if (!input || typeof input !== 'object') {
    return buildFallbackContinuation(story, selectedChoice, style);
  }

  const raw = input as Record<string, unknown>;
  const fallback = buildFallbackContinuation(story, selectedChoice, style);
  const startPage = story.scenes.length + 1;

  const scenes = asArray(raw.continuation_scenes)
    .slice(0, 3)
    .map((scene, index) => normalizeScene(scene, startPage + index, index === 2 ? 'fantasy_clouds' : 'forest'));

  return {
    story_id: safeString(raw.story_id, story.story_id),
    child_name: safeString(raw.child_name, story.child_name),
    continuation_scenes: scenes.length === 3 ? scenes : fallback.continuation_scenes,
    ending_message: safeString(raw.ending_message, fallback.ending_message),
  };
}

export function summarizeScenes(story: StoryPayload) {
  return story.scenes
    .map((scene) => `페이지 ${scene.page}: ${scene.text}`)
    .join('\\n');
}
