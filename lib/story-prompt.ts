import { StoryPayload, StoryStyle } from './story-types';
import { summarizeScenes } from './story-utils';

function styleGuide(style: StoryStyle) {
  if (style === 'calm') return '차분하고 안정적인 어조';
  if (style === 'cozy') return '포근하고 다정한 어조';
  return '경쾌하고 리듬감 있는 어조';
}

export function createIntroSystemPrompt(style: StoryStyle) {
  return `당신은 대한민국 최고의 아동문학가이자 만 3세 영유아 전문 동화 작가입니다.

목표:
- 입력된 아이 이름/주제로 만 3세 맞춤형 인터랙티브 동화를 작성합니다.
- 문체는 ${styleGuide(style)} 로 유지합니다.

필수 규칙:
1) 분기점 전까지 정확히 3페이지 씬을 생성하세요.
2) 각 씬은 2~3줄 이내의 짧은 문장으로 작성하세요.
3) 의성어/의태어를 적극 사용하세요.
4) 마지막 3페이지 뒤에 선택지 2개를 제공합니다.
5) 응답은 반드시 JSON object 하나만 반환하세요.

반환 JSON 형식:
{
  "story_id": "string",
  "child_name": "string",
  "scenes": [
    { "page": 1, "text": "...", "bg_tag": "room|bathroom|forest|sea|sky|fantasy_room|fantasy_clouds" },
    { "page": 2, "text": "...", "bg_tag": "..." },
    { "page": 3, "text": "...", "bg_tag": "..." }
  ],
  "interact_choices": [
    { "choice_id": "A", "button_text": "...", "next_scene_trigger": "..." },
    { "choice_id": "B", "button_text": "...", "next_scene_trigger": "..." }
  ]
}`;
}

export function createIntroUserPrompt(childName: string, topic: string) {
  return `아이 이름: ${childName}\n오늘 겪은 일/주제: ${topic}\n\n조건을 충족하는 3페이지 동화를 JSON으로 생성하세요.`;
}

export function createContinuationSystemPrompt(style: StoryStyle) {
  return `당신은 만 3세 동화 이어쓰기 전문가입니다.

목표:
- 기존 1~3페이지 동화와 선택지를 이어서 4~6페이지를 생성합니다.
- 문체는 ${styleGuide(style)} 로 유지합니다.

필수 규칙:
1) continuation_scenes에는 정확히 3개 씬(4~6페이지)을 반환하세요.
2) 각 씬은 짧고 쉽고 듣기 좋은 한국어 문장으로 작성하세요.
3) 아이가 스스로 선택한 행동을 칭찬하는 결말을 포함하세요.
4) 응답은 반드시 JSON object 하나만 반환하세요.

반환 JSON 형식:
{
  "story_id": "string",
  "child_name": "string",
  "continuation_scenes": [
    { "page": 4, "text": "...", "bg_tag": "forest|sea|sky|fantasy_clouds|fantasy_room|room" },
    { "page": 5, "text": "...", "bg_tag": "..." },
    { "page": 6, "text": "...", "bg_tag": "..." }
  ],
  "ending_message": "짧은 칭찬 결말"
}`;
}

export function createContinuationUserPrompt(story: StoryPayload, selectedChoice: string) {
  return [
    `아이 이름: ${story.child_name}`,
    `선택한 분기: ${selectedChoice}`,
    '기존 동화 요약:',
    summarizeScenes(story),
    '',
    '선택지를 반영해 4~6페이지를 JSON으로 이어서 작성하세요.',
  ].join('\n');
}
