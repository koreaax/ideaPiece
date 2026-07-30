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

const characterMap: Record<string, string> = {
  happy: '/images/characters/happy.svg',
  thinking: '/images/characters/thinking.svg',
  brave: '/images/characters/brave.svg',
  proud: '/images/characters/proud.svg',
};

export function backgroundFromTag(tag: string) {
  return backgroundMap[tag] || '/images/bg/default.svg';
}

export function characterFromScene(index: number, total: number) {
  if (index === 0) return characterMap.thinking;
  if (index < Math.max(1, total - 2)) return characterMap.happy;
  if (index === total - 1) return characterMap.proud;
  return characterMap.brave;
}
