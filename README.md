# Fairytale IdeaPiece

MD 문서(만 3세 맞춤형 인터랙티브 동화 프롬프트 킷)를 기반으로 만든 웹서비스입니다.

## 구현 범위
- 모바일 퍼스트 입력 폼
- 1~3페이지 동화 생성
- 분기 선택 카드 UI
- 선택 이후 4~6페이지 자동 이어쓰기
- OpenAI/Gemini 실제 키 연결 및 품질 튜닝(provider/model/temperature/style)
- 로컬 이미지 레이어링 구조(public/images/bg, public/images/characters)

## 실행
1. `cd C:\thinking2\ideaPiece`
2. `npm install`
3. `npm run dev`
4. 브라우저: `http://localhost:3000` (점유 시 3001)

## GitHub Pages 배포 (koreaax.github.io/ideaPiece)
README만 보이는 경우는 보통 Pages 소스가 앱 빌드 결과물이 아니라 기본 브랜치 문서로 잡혀 있을 때 발생합니다.

이 프로젝트는 GitHub Pages용 워크플로를 포함합니다.

1. 레포 루트에 이 프로젝트 파일들이 있어야 합니다.
2. GitHub 저장소 Settings > Pages 에서 Source를 `GitHub Actions`로 변경합니다.
3. `main` 브랜치에 push 하면 `.github/workflows/deploy-pages.yml`이 자동으로 정적 사이트를 배포합니다.
4. 배포 주소: `https://koreaax.github.io/ideaPiece/`

로컬에서 Pages 빌드만 확인하려면:

1. `npm run build:pages`
2. `out` 폴더가 생성되면 정적 배포 준비 완료

## 환경 변수
`.env.local` 파일을 만들고 아래를 채우세요.

- `LLM_PROVIDER=auto|openai|gemini`
- `OPENAI_API_KEY=`
- `OPENAI_MODEL=gpt-4o-mini`
- `GEMINI_API_KEY=`
- `GEMINI_MODEL=gemini-1.5-flash`

키가 없거나 API 실패 시에도 fallback 동화로 동작합니다.

주의: GitHub Pages는 정적 호스팅이라 서버 API(`app/api`)를 직접 실행하지 못합니다.
그래서 Pages 모드에서는 앱이 클라이언트 fallback 생성 로직으로 동작합니다.

## 주요 파일
- `app/page.tsx`
- `components/fairytale-studio.tsx`
- `app/api/story/route.ts`
- `app/api/story/continue/route.ts`
- `lib/llm.ts`
- `lib/story-prompt.ts`
- `lib/story-utils.ts`
