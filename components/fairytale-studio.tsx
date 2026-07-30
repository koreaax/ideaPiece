'use client';

import React from 'react';
import { ChevronRight, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import {
  ContinuationPayload,
  DEFAULT_SETTINGS,
  GenerationSettings,
  StoryChoice,
  StoryPayload,
  STYLE_LABELS,
  TOPIC_OPTIONS,
} from '../lib/story-types';
import { backgroundFromTag, characterFromScene } from '../lib/story-visuals';
import { buildFallbackContinuation, buildFallbackIntroStory } from '../lib/story-utils';

type ViewState = 'form' | 'reader' | 'choice' | 'ending';

type ApiMeta = {
  source?: string;
  provider?: string;
  model?: string;
};

function nextButtonText(sceneIndex: number, sceneCount: number) {
  if (sceneIndex < sceneCount - 1) return '다음';
  if (sceneCount <= 3) return '선택하기';
  return '완료';
}

function parseInitialResponse(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const payload = data as Record<string, unknown>;

  if (payload.story && typeof payload.story === 'object') {
    return {
      story: payload.story as StoryPayload,
      meta: (payload.meta as ApiMeta | undefined) ?? {},
    };
  }

  if (payload.scenes) {
    return {
      story: payload as StoryPayload,
      meta: {},
    };
  }

  return null;
}

function parseContinuationResponse(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const payload = data as Record<string, unknown>;

  if (payload.continuation && typeof payload.continuation === 'object') {
    return {
      continuation: payload.continuation as ContinuationPayload,
      meta: (payload.meta as ApiMeta | undefined) ?? {},
    };
  }

  if (payload.continuation_scenes) {
    return {
      continuation: payload as ContinuationPayload,
      meta: {},
    };
  }

  return null;
}

export function FairytaleStudio() {
  const isStaticMode = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
  const [view, setView] = React.useState<ViewState>('form');
  const [childName, setChildName] = React.useState('');
  const [selectedTopic, setSelectedTopic] = React.useState(TOPIC_OPTIONS[0].value);
  const [customTopic, setCustomTopic] = React.useState('');
  const [story, setStory] = React.useState<StoryPayload | null>(null);
  const [sceneIndex, setSceneIndex] = React.useState(0);
  const [selectedChoice, setSelectedChoice] = React.useState('');
  const [endingMessage, setEndingMessage] = React.useState('');
  const [lastMeta, setLastMeta] = React.useState<ApiMeta>({});

  const [settings, setSettings] = React.useState<GenerationSettings>(DEFAULT_SETTINGS);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isContinuing, setIsContinuing] = React.useState(false);
  const [error, setError] = React.useState('');

  const topic = customTopic.trim() || selectedTopic;
  const currentScene = story?.scenes[sceneIndex];
  const backgroundSrc = backgroundFromTag(currentScene?.bg_tag || 'room');
  const characterSrc = characterFromScene(story ? sceneIndex : 0, story?.scenes.length || 1);

  async function handleCreateStory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!childName.trim()) {
      setError('아이 이름을 먼저 입력해 주세요.');
      return;
    }

    if (!topic.trim()) {
      setError('주제를 선택하거나 입력해 주세요.');
      return;
    }

    setIsGenerating(true);

    try {
      if (isStaticMode) {
        const fallback = buildFallbackIntroStory(childName.trim(), topic.trim(), settings.style);
        setStory(fallback);
        setSceneIndex(0);
        setSelectedChoice('');
        setEndingMessage('');
        setLastMeta({ source: 'client-static-fallback', provider: 'local', model: 'fallback' });
        setView('reader');
        return;
      }

      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childName.trim(),
          topic: topic.trim(),
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('초기 동화 생성에 실패했어요.');
      }

      const parsed = parseInitialResponse(await response.json());
      if (!parsed || !parsed.story || !Array.isArray(parsed.story.scenes)) {
        throw new Error('동화 응답 형식이 올바르지 않아요.');
      }

      setStory(parsed.story);
      setSceneIndex(0);
      setSelectedChoice('');
      setEndingMessage('');
      setLastMeta(parsed.meta);
      setView('reader');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했어요.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePickChoice(choice: StoryChoice) {
    if (!story) return;

    setSelectedChoice(choice.button_text);
    setIsContinuing(true);
    setError('');

    try {
      if (isStaticMode) {
        const continuation = buildFallbackContinuation(story, choice.button_text, settings.style);
        const mergedScenes = [...story.scenes, ...continuation.continuation_scenes];
        setStory({ ...story, scenes: mergedScenes });
        setEndingMessage(continuation.ending_message);
        setSceneIndex(story.scenes.length);
        setLastMeta({ source: 'client-static-fallback', provider: 'local', model: 'fallback' });
        setView('reader');
        return;
      }

      const response = await fetch('/api/story/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          selectedChoice: choice.button_text,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('후속 페이지 생성에 실패했어요.');
      }

      const parsed = parseContinuationResponse(await response.json());
      if (!parsed || !Array.isArray(parsed.continuation.continuation_scenes)) {
        throw new Error('후속 페이지 응답 형식이 올바르지 않아요.');
      }

      const mergedScenes = [...story.scenes, ...parsed.continuation.continuation_scenes];
      setStory({ ...story, scenes: mergedScenes });
      setEndingMessage(parsed.continuation.ending_message);
      setSceneIndex(story.scenes.length);
      setLastMeta(parsed.meta);
      setView('reader');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '자동 이어쓰기에 실패했어요.';
      setError(message);
      setView('choice');
    } finally {
      setIsContinuing(false);
    }
  }

  function handleNext() {
    if (!story) return;

    if (sceneIndex < story.scenes.length - 1) {
      setSceneIndex((value) => value + 1);
      return;
    }

    if (story.scenes.length <= 3) {
      setView('choice');
      return;
    }

    setView('ending');
  }

  function handleRestart() {
    setView('form');
    setStory(null);
    setSceneIndex(0);
    setSelectedChoice('');
    setEndingMessage('');
    setError('');
    setLastMeta({});
  }

  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="rounded-[2rem] border-4 border-white/70 bg-white/85 p-5 shadow-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4" />
            만 3세 인터랙티브 동화
          </div>
          <h1 className="text-3xl font-black text-slate-800 sm:text-4xl">오늘의 맞춤 동화 만들기</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            입력 → 동화 1~3페이지 → 분기 선택 → 자동 4~6페이지 이어쓰기
          </p>

          {lastMeta.provider ? (
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
              마지막 생성: {lastMeta.provider} / {lastMeta.model || 'default'} / {lastMeta.source || 'unknown'}
            </p>
          ) : null}
        </header>

        {view === 'form' ? (
          <section className="mt-5 rounded-[2rem] border-4 border-white/70 bg-white/90 p-5 shadow-xl">
            <form onSubmit={handleCreateStory} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">아이 이름</label>
                <input
                  value={childName}
                  onChange={(event) => setChildName(event.target.value)}
                  placeholder="예: 하영"
                  className="h-16 w-full rounded-3xl border-2 border-slate-200 bg-[var(--yellow-soft)] px-5 text-xl outline-none transition focus:border-[var(--mint-deep)]"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-slate-700">오늘의 주제 선택</p>
                <div className="grid grid-cols-2 gap-3">
                  {TOPIC_OPTIONS.map((item) => {
                    const active = selectedTopic === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedTopic(item.value)}
                        className={`tap-bounce min-h-24 rounded-3xl border-2 px-3 py-4 text-left ${
                          active
                            ? 'border-[var(--mint-deep)] bg-[var(--mint)]/70 shadow-lg'
                            : 'border-slate-200 bg-white hover:border-[var(--mint)]'
                        }`}
                      >
                        <div className="text-3xl">{item.emoji}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-700">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">직접 입력 (선택)</label>
                <input
                  value={customTopic}
                  onChange={(event) => setCustomTopic(event.target.value)}
                  placeholder="예: 친구에게 미안한 마음"
                  className="h-14 w-full rounded-3xl border-2 border-slate-200 bg-white px-5 text-base outline-none transition focus:border-[var(--peach)]"
                />
              </div>

              <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Wand2 className="h-4 w-4" />
                  실제 LLM 품질 튜닝
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Provider
                    <select
                      value={settings.provider}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, provider: event.target.value as GenerationSettings['provider'] }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="auto">auto (키 있는 쪽 자동)</option>
                      <option value="openai">openai</option>
                      <option value="gemini">gemini</option>
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Model (선택)
                    <input
                      value={settings.model}
                      onChange={(event) => setSettings((prev) => ({ ...prev, model: event.target.value }))}
                      placeholder="예: gpt-4o-mini / gemini-1.5-flash"
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    />
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Style
                    <select
                      value={settings.style}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, style: event.target.value as GenerationSettings['style'] }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      {Object.entries(STYLE_LABELS).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Temperature: {settings.temperature.toFixed(2)}
                    <input
                      type="range"
                      min={0}
                      max={1.2}
                      step={0.05}
                      value={settings.temperature}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, temperature: Number(event.target.value) }))
                      }
                      className="mt-2 w-full"
                    />
                  </label>
                </div>
              </div>

              {error ? <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              <button
                type="submit"
                disabled={isGenerating}
                className="tap-bounce flex h-24 w-full items-center justify-center gap-3 rounded-[2rem] bg-[var(--mint-deep)] text-2xl font-black text-white shadow-lg disabled:opacity-70"
              >
                {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                <span>{isGenerating ? '동화 만드는 중...' : '동화책 만들기'}</span>
              </button>
            </form>
          </section>
        ) : null}

        {view === 'reader' && story && currentScene ? (
          <section className="mt-5">
            <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border-4 border-white/70 bg-white shadow-xl sm:min-h-[700px]">
              <img src={backgroundSrc} alt="동화 배경" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />

              <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-700">
                {currentScene.page} / {story.scenes.length}
              </div>

              <img
                src={characterSrc}
                alt="동화 캐릭터"
                className="animate-float absolute bottom-[28%] left-1/2 h-44 w-44 -translate-x-1/2 object-contain sm:h-52 sm:w-52"
              />

              <div className="absolute inset-x-0 bottom-0 h-[27%] bg-white/92 px-6 py-5">
                <p className="text-xl leading-relaxed text-slate-800 sm:text-2xl">{currentScene.text}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">아래 버튼을 눌러 다음 장면으로 이동해요.</p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="tap-bounce absolute bottom-4 right-4 inline-flex h-16 min-w-28 items-center justify-center gap-1 rounded-full bg-[var(--mint-deep)] px-5 text-lg font-black text-white shadow-lg"
              >
                {nextButtonText(sceneIndex, story.scenes.length)}
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </section>
        ) : null}

        {view === 'choice' && story ? (
          <section className="mt-5 rounded-[2rem] border-4 border-white/70 bg-white/90 p-5 shadow-xl">
            <h2 className="text-2xl font-black text-slate-800">어디로 모험을 갈까요?</h2>
            <p className="mt-1 text-sm text-slate-600">카드를 누르면 자동으로 4~6페이지를 이어서 생성해요.</p>

            {error ? <p className="mt-3 rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {story.interact_choices.map((choice) => (
                <button
                  key={choice.choice_id}
                  type="button"
                  onClick={() => handlePickChoice(choice)}
                  disabled={isContinuing}
                  className="tap-bounce flex min-h-[35vh] items-center justify-center rounded-[2rem] border-2 border-slate-200 bg-gradient-to-b from-white to-[var(--yellow-soft)] p-4 shadow-lg disabled:opacity-70"
                >
                  {isContinuing ? (
                    <span className="inline-flex items-center gap-2 text-xl font-black text-slate-700">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      이어쓰기 생성 중
                    </span>
                  ) : (
                    <span className="text-4xl font-black text-slate-700">{choice.button_text}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {view === 'ending' ? (
          <section className="mt-5 rounded-[2rem] border-4 border-white/70 bg-white/95 p-6 text-center shadow-xl">
            <h2 className="text-3xl font-black text-slate-800">모험 완료</h2>
            <p className="mt-3 text-lg text-slate-700">선택한 길: {selectedChoice || '모험의 길'}</p>
            <p className="mt-2 text-base text-slate-700">{endingMessage || '오늘의 모험을 끝까지 해냈어요!'}</p>

            <button
              type="button"
              onClick={handleRestart}
              className="tap-bounce mx-auto mt-6 inline-flex h-16 items-center justify-center gap-2 rounded-full bg-[var(--peach)] px-8 text-xl font-black text-slate-800 shadow-lg"
            >
              <RefreshCw className="h-5 w-5" />
              처음부터 다시
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
