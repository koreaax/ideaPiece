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

## 환경 변수
`.env.local` 파일을 만들고 아래를 채우세요.

- `LLM_PROVIDER=auto|openai|gemini`
- `OPENAI_API_KEY=`
- `OPENAI_MODEL=gpt-4o-mini`
- `GEMINI_API_KEY=`
- `GEMINI_MODEL=gemini-1.5-flash`

키가 없거나 API 실패 시에도 fallback 동화로 동작합니다.

## 주요 파일
- `app/page.tsx`
- `components/fairytale-studio.tsx`
- `app/api/story/route.ts`
- `app/api/story/continue/route.ts`
- `lib/llm.ts`
- `lib/story-prompt.ts`
- `lib/story-utils.ts`
