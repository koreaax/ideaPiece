const backgroundMap: Record<string, string> = {
  room: '/images/bg/bedroom.svg',
  bedroom: '/images/bg/bedroom.svg',
  bathroom: '/images/bg/bathroom.svg',
  forest: '/images/bg/forest.svg',
  sea: '/images/bg/sea.svg',
  sky: '/images/bg/fantasy_clouds.svg',
  fantasy_room: '/images/bg/fantasy_room.svg',
  fantasy_clouds: '/images/bg/fantasy_clouds.svg',
};

const characterMap = {
  happy: '/images/characters/happy.svg',
  thinking: '/images/characters/thinking.svg',
  brave: '/images/characters/brave.svg',
  proud: '/images/characters/proud.svg',
} as const;

type CharacterMood = keyof typeof characterMap;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function withBasePath(urlPath: string) {
  if (!basePath) return urlPath;
  return `${basePath}${urlPath}`;
}

export function backgroundFromTag(tag: string) {
  return withBasePath(backgroundMap[tag] || '/images/bg/default.svg');
}

/**
 * 페이지 순서 기반 기본 캐릭터 무드 (텍스트 분석이 실패했을 때의 폴백)
 */
export function characterFromScene(index: number, total: number) {
  if (index === 0) return withBasePath(characterMap.thinking);
  if (index < Math.max(1, total - 2)) return withBasePath(characterMap.happy);
  if (index === total - 1) return withBasePath(characterMap.proud);
  return withBasePath(characterMap.brave);
}

// 감정 키워드 → 캐릭터 무드 매핑 (우선순위 순서대로 검사)
const moodKeywordRules: Array<{ mood: CharacterMood; keywords: string[] }> = [
  {
    mood: 'brave',
    keywords: [
      '용기',
      '용감',
      '씩씩하게',
      '도전',
      '모험',
      '무섭지 않고',
      '뛰어들',
      '앞장서',
      '헤쳐',
    ],
  },
  {
    mood: 'proud',
    keywords: [
      '해냈어요',
      '성공',
      '대성공',
      '뿌듯',
      '칭찬',
      '잘했어',
      '자랑스러',
      '하이파이브',
      '으쓱',
    ],
  },
  {
    mood: 'thinking',
    keywords: [
      '고민',
      '걱정',
      '어떻게 할까',
      '머뭇',
      '망설',
      '어려워',
      '떨려',
      '콩닥콩닥',
      '궁금',
    ],
  },
  {
    mood: 'happy',
    keywords: [
      '웃음',
      '기쁘',
      '신나서',
      '헤헤',
      '기쁘게',
      '즐거워',
      '반가워',
      '까르르',
      '방긋',
    ],
  },
];

/**
 * 씬 텍스트에 등장하는 감정 키워드를 분석해 맥락에 맞는 캐릭터 이미지를 반환한다.
 * 매칭되는 키워드가 없으면 기존 페이지 순서 기반 로직(characterFromScene)으로 폴백한다.
 */
export function characterFromText(text: string, index: number, total: number) {
  const normalized = text || '';

  for (const rule of moodKeywordRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return withBasePath(characterMap[rule.mood]);
    }
  }

  return characterFromScene(index, total);
}
