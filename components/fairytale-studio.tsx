'use client';

import React from 'react';
import { BookOpen, CalendarCheck, ChevronRight, Crown, Download, Library, Loader2, Lock, LogOut, Pause, Play, RefreshCw, Sparkles, Trash2, User, Volume2, Wand2, WifiOff, X, Music2 } from 'lucide-react';
import {
  ContinuationPayload,
  DEFAULT_SETTINGS,
  GenerationSettings,
  StoryChoice,
  StoryPayload,
  STYLE_LABELS,
  TOPIC_OPTIONS,
} from '../lib/story-types';
import { backgroundFromTag, characterFromText, CHARACTER_OPTIONS, CharacterMood } from '../lib/story-visuals';
import { buildFallbackContinuation, buildFallbackIntroStory } from '../lib/story-utils';
import {
  getAvailableKoreanVoices,
  getSpeechPreferences,
  isSpeechSupported,
  pauseSpeech,
  resumeSpeech,
  saveSpeechPreferences,
  speakText,
  SpeechPreferences,
  stopSpeech,
} from '../lib/speech';
import { playChoiceSound, playCompleteSound, playPageTurnSound, startAmbientMusic, stopAmbientMusic, getAmbientMusicPreference, saveAmbientMusicPreference } from '../lib/sound';
import { SavedStory, deleteSavedStory, getCompletionStats, getSavedStories, logCompletion, saveStory } from '../lib/story-storage';
import { Badge, BADGE_DEFINITIONS, getEarnedBadges, getNewlyEarnedBadges, markBadgesAsSeen } from '../lib/badges';
import { addUsageMs, hasReachedDailyLimit } from '../lib/parent-mode';
import { getCharacterPreference, saveCharacterPreference } from '../lib/character-preference';
import { useSupabase } from '../contexts/supabase-context';
import ParentGate from './parent-gate';
import ParentSettingsPanel from './parent-settings';
import InstallPrompt from './install-prompt';
import AuthModal from './auth-modal';
import PricingModal from './pricing-modal';
import ExportButtons from './export-buttons';

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
  const [selectedCharacter, setSelectedCharacter] = React.useState<CharacterMood | null>(() => getCharacterPreference());
  const [story, setStory] = React.useState<StoryPayload | null>(null);
  const [sceneIndex, setSceneIndex] = React.useState(0);
  const [selectedChoice, setSelectedChoice] = React.useState('');
  const [endingMessage, setEndingMessage] = React.useState('');
  const [lastMeta, setLastMeta] = React.useState<ApiMeta>({});

  const [settings, setSettings] = React.useState<GenerationSettings>({
    ...DEFAULT_SETTINGS,
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.65,
  });

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isContinuing, setIsContinuing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [sentences, setSentences] = React.useState<string[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = React.useState(0);
  const [topicUsed, setTopicUsed] = React.useState('');
  const [showLibrary, setShowLibrary] = React.useState(false);
  const [savedStories, setSavedStories] = React.useState<SavedStory[]>([]);
  const [completionStats, setCompletionStats] = React.useState<{ thisWeekCount: number; totalCount: number }>({
    thisWeekCount: 0,
    totalCount: 0,
  });
  const [showParentGate, setShowParentGate] = React.useState(false);
  const [showParentSettings, setShowParentSettings] = React.useState(false);
  const [speechPrefs, setSpeechPrefs] = React.useState<SpeechPreferences>(() => getSpeechPreferences());
  const [availableVoices, setAvailableVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [newBadges, setNewBadges] = React.useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = React.useState<Badge[]>([]);
  const [ambientMusicEnabled, setAmbientMusicEnabled] = React.useState<boolean>(() => getAmbientMusicPreference());
  const [isOffline, setIsOffline] = React.useState(false);
  const { user, profile, signOut } = useSupabase();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showPricingModal, setShowPricingModal] = React.useState(false);
  const isPremiumUser = profile?.plan === 'premium';
  const isAdminUser = profile?.role === 'admin';

  const advanceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const readerEnteredAtRef = React.useRef<number | null>(null);

  const topic = customTopic.trim() || selectedTopic;
  const currentScene = story?.scenes[sceneIndex];
  const backgroundSrc = backgroundFromTag(currentScene?.bg_tag || 'room');
  const characterSrc = characterFromText(currentScene?.text || '', story ? sceneIndex : 0, story?.scenes.length || 1, selectedCharacter);

  // handleNext: useEffect가 의존하므로 useEffect 선언 전에 정의
  const handleNext = React.useCallback(() => {
    if (!story) return;

    stopSpeech();

    if (sceneIndex < story.scenes.length - 1) {
      playPageTurnSound();
      setSceneIndex((value) => value + 1);
      return;
    }

    if (story.scenes.length <= 3) {
      playPageTurnSound();
      setView('choice');
      return;
    }

    playCompleteSound();
    saveStory({
      childName: story.child_name,
      topic: topicUsed || story.child_name,
      scenes: story.scenes,
      endingMessage,
      selectedChoice,
    });
    setSavedStories(getSavedStories());
    logCompletion(topicUsed || story.child_name);
    const fresh = getNewlyEarnedBadges();
    setNewBadges(fresh);
    markBadgesAsSeen();
    setView('ending');
  }, [story, sceneIndex, topicUsed, endingMessage, selectedChoice]);

  // 자동 음성 재생 + 재생 완료 후 자동 페이지 넘김
  React.useEffect(() => {
    setIsPaused(false);
    setSentences([]);
    setActiveSentenceIndex(0);

    if (view !== 'reader' || !currentScene?.text) {
      return () => {
        stopSpeech();
      };
    }

    const startTimer = setTimeout(() => {
      if (isSpeechSupported()) {
        speakText(currentScene.text, {
          onStart: () => setIsSpeaking(true),
          onSentenceStart: (index, allSentences) => {
            setSentences(allSentences);
            setActiveSentenceIndex(index);
          },
          onEnd: () => {
            setIsSpeaking(false);
            advanceTimerRef.current = setTimeout(() => {
              handleNext();
            }, 1200);
          },
        });
      } else {
        advanceTimerRef.current = setTimeout(() => {
          handleNext();
        }, 6000);
      }
    }, 300);

    return () => {
      clearTimeout(startTimer);
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      stopSpeech();
    };
  }, [view, sceneIndex, story, handleNext]);

  // 컴포넌트 언마운트 시 음성 중단
  React.useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // 저장된 동화 목록 최초 로드
  React.useEffect(() => {
    setSavedStories(getSavedStories());
  }, []);

  // 온라인/오프라인 상태 추적: 저장된 동화를 오프라인에서도 다시 읽을 수 있음을 안내하기 위함
  React.useEffect(() => {
    setIsOffline(!navigator.onLine);

    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 사용 가능한 한국어 음성 목록 로드
  React.useEffect(() => {
    let cancelled = false;
    getAvailableKoreanVoices().then((voices) => {
      if (!cancelled) setAvailableVoices(voices);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // reader 화면 사용 시간 추적: view 진입/이탈, 탭 가시성 변화 시점에 델타를 누적치에 더함 (폴링 없음)
  React.useEffect(() => {
    function flushElapsed() {
      const startedAt = readerEnteredAtRef.current;
      if (startedAt === null) return;
      const delta = Date.now() - startedAt;
      readerEnteredAtRef.current = null;
      addUsageMs(delta);
    }

    if (view === 'reader') {
      readerEnteredAtRef.current = Date.now();
    } else {
      flushElapsed();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushElapsed();
      } else if (view === 'reader') {
        readerEnteredAtRef.current = Date.now();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushElapsed();
    };
  }, [view]);

  // 배경음악 제어: view === 'reader' && ambientMusicEnabled이면 시작, 아니면 정지
  React.useEffect(() => {
    if (view === 'reader' && ambientMusicEnabled) {
      startAmbientMusic();
    } else {
      stopAmbientMusic();
    }

    return () => {
      stopAmbientMusic();
    };
  }, [view, ambientMusicEnabled]);

  async function handleCreateStory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (hasReachedDailyLimit()) {
      setError('오늘은 여기까지! 내일 또 만나요 🌙');
      return;
    }

    if (!childName.trim()) {
      setError('아이 이름을 먼저 입력해 주세요.');
      return;
    }

    if (!topic.trim()) {
      setError('주제를 선택하거나 입력해 주세요.');
      return;
    }

    setTopicUsed(topic.trim());

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
        const errJson = await response.json().catch(() => ({}));
        if (errJson.isLimitReached) {
          setShowPricingModal(true);
        }
        throw new Error(errJson.error || '초기 동화 생성에 실패했어요.');
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

    stopSpeech();
    playChoiceSound();
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


  function handleRestart() {
    stopSpeech();
    setView('form');
    setStory(null);
    setSceneIndex(0);
    setSelectedChoice('');
    setEndingMessage('');
    setError('');
    setLastMeta({});
    setTopicUsed('');
  }

  function handleOpenLibrary() {
    setSavedStories(getSavedStories());
    setCompletionStats(getCompletionStats());
    setEarnedBadges(getEarnedBadges());
    setShowLibrary(true);

  }

  function handleDeleteSaved(id: string) {
    deleteSavedStory(id);
    setSavedStories(getSavedStories());
  }

  function handleLoadSaved(saved: SavedStory) {
    stopSpeech();
    setStory({
      story_id: saved.id,
      child_name: saved.childName,
      scenes: saved.scenes,
      interact_choices: [],
    });
    setSceneIndex(0);
    setSelectedChoice(saved.selectedChoice);
    setEndingMessage(saved.endingMessage);
    setTopicUsed(saved.topic);
    setLastMeta({ source: 'saved-library', provider: 'local', model: 'saved' });
    setShowLibrary(false);
    setView('reader');
  }

  function handleOpenParentGate() {
    setShowParentGate(true);
  }

  function handleParentGateSuccess() {
    setShowParentGate(false);
    setShowParentSettings(true);
  }

  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="rounded-[2rem] border-4 border-white/70 bg-white/85 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4" />
              만 3세 인터랙티브 동화
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPricingModal(true)}
                className={`tap-bounce inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition shadow-sm ${
                  isAdminUser
                    ? 'bg-indigo-100 text-indigo-900 border-2 border-indigo-300'
                    : isPremiumUser
                      ? 'bg-amber-100 text-amber-900 border-2 border-amber-300'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:brightness-105'
                }`}
              >
                <Crown className={`h-4 w-4 fill-current ${isAdminUser ? 'text-indigo-300' : 'text-amber-200'}`} />
                {isAdminUser ? '관리자 👑' : isPremiumUser ? '프리미엄 👑' : '멤버십 구독하기'}
              </button>

              {user ? (
                <div className="inline-flex items-center gap-1">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                    <User className="inline h-3.5 w-3.5 mr-1" />
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="tap-bounce rounded-full border border-slate-200 bg-white p-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
                    title="로그아웃"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="tap-bounce inline-flex items-center gap-1 rounded-full border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[var(--mint-deep)]"
                >
                  <User className="h-3.5 w-3.5" />
                  로그인 / 가입
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenLibrary}
                className="tap-bounce inline-flex items-center gap-1 rounded-full border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[var(--mint-deep)]"
              >
                <Library className="h-4 w-4" />
                저장된 동화 {savedStories.length > 0 ? `(${savedStories.length})` : ''}
              </button>
              <button
                type="button"
                onClick={handleOpenParentGate}
                className="tap-bounce inline-flex items-center gap-1 rounded-full border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[var(--peach)]"
              >
                <Lock className="h-4 w-4" />
                부모 설정
              </button>
              <InstallPrompt />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-800 sm:text-4xl">오늘의 맞춤 동화 만들기</h1>
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
                <p className="mb-3 text-sm font-bold text-slate-700">오늘의 이야기</p>
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
                <label className="mb-2 block text-sm font-bold text-slate-700">직접 입력 (선택사항)</label>
                <input
                  value={customTopic}
                  onChange={(event) => setCustomTopic(event.target.value)}
                  placeholder="예: 친구와 화해하기"
                  className="h-14 w-full rounded-3xl border-2 border-slate-200 bg-white px-5 text-base outline-none transition focus:border-[var(--peach)]"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-slate-700">캐릭터 선택</p>
                <div className="grid grid-cols-3 gap-3">
                  {CHARACTER_OPTIONS.map((item) => {
                    const active = selectedCharacter === item.mood;
                    return (
                      <button
                        key={item.mood}
                        type="button"
                        onClick={() => {
                          setSelectedCharacter(item.mood);
                          saveCharacterPreference(item.mood);
                        }}
                        className={`tap-bounce min-h-24 rounded-3xl border-2 px-3 py-4 text-left ${
                          active
                            ? 'border-[var(--mint-deep)] bg-[var(--mint)]/70 shadow-lg'
                            : 'border-slate-200 bg-white hover:border-[var(--mint)]'
                        }`}
                      >
                        <div className="text-3xl">{item.emoji}</div>
                        <div className="mt-2 text-xs font-semibold text-slate-700">{item.label}</div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCharacter(null);
                      saveCharacterPreference(null);
                    }}
                    className={`tap-bounce min-h-24 rounded-3xl border-2 px-3 py-4 text-left ${
                      selectedCharacter === null
                        ? 'border-[var(--mint-deep)] bg-[var(--mint)]/70 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-[var(--mint)]'
                    }`}
                  >
                    <div className="text-3xl">✨</div>
                    <div className="mt-2 text-xs font-semibold text-slate-700">자동 선택</div>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Wand2 className="h-4 w-4" />
                  동화 분위기 선택
                </div>

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
              </div>

              {availableVoices.length > 0 ? (
                <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Volume2 className="h-4 w-4" />
                    목소리 & 속도 설정
                  </div>

                  <label className="text-xs font-semibold text-slate-600">
                    목소리
                    <select
                      value={speechPrefs.voiceURI ?? ''}
                      onChange={(event) => {
                        const nextPrefs: SpeechPreferences = {
                          ...speechPrefs,
                          voiceURI: event.target.value || null,
                        };
                        setSpeechPrefs(nextPrefs);
                        saveSpeechPreferences(nextPrefs);
                      }}
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">자동 선택</option>
                      {availableVoices.map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-3 block text-xs font-semibold text-slate-600">
                    읽어주는 속도 · {speechPrefs.rate.toFixed(2)}배
                    <input
                      type="range"
                      min={0.6}
                      max={1.2}
                      step={0.05}
                      value={speechPrefs.rate}
                      onChange={(event) => {
                        const nextPrefs: SpeechPreferences = {
                          ...speechPrefs,
                          rate: Number(event.target.value),
                        };
                        setSpeechPrefs(nextPrefs);
                        saveSpeechPreferences(nextPrefs);
                      }}
                      className="mt-2 w-full accent-[var(--mint-deep)]"
                    />
                  </label>
                </div>
              ) : (
                <p className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                  음성 옵션을 사용할 수 없어요
                </p>
              )}

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
                {sentences.length > 0 ? (
                  <p className="text-xl leading-relaxed text-slate-800 sm:text-2xl">
                    {sentences.map((sentence, index) => (
                      <span
                        key={`${index}-${sentence.slice(0, 6)}`}
                        className={
                          index === activeSentenceIndex
                            ? 'rounded bg-[var(--peach)]/60 px-1 text-slate-900 transition-colors'
                            : 'text-slate-800 transition-colors'
                        }
                      >
                        {sentence}{' '}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-xl leading-relaxed text-slate-800 sm:text-2xl">{currentScene.text}</p>
                )}
                <p className="mt-1 text-xs font-semibold text-slate-500">아래 버튼을 눌러 다음 장면으로 이동해요.</p>

                {/* 음성 컨트롤 버튼: 다시 듣기 + 일시정지/재생 */}
                {isSpeechSupported() && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (advanceTimerRef.current) {
                          clearTimeout(advanceTimerRef.current);
                          advanceTimerRef.current = null;
                        }
                        setIsPaused(false);
                        speakText(currentScene.text, {
                          onStart: () => setIsSpeaking(true),
                          onSentenceStart: (index, allSentences) => {
                            setSentences(allSentences);
                            setActiveSentenceIndex(index);
                          },
                          onEnd: () => {
                            setIsSpeaking(false);
                            advanceTimerRef.current = setTimeout(() => {
                              handleNext();
                            }, 1200);
                          },
                        });
                      }}
                      className="tap-bounce inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--peach)] text-slate-800 shadow-lg transition hover:bg-[var(--peach)]/90"
                      title="다시 듣기"
                    >
                      <Volume2 className={`h-5 w-5 ${isSpeaking && !isPaused ? 'animate-pulse' : ''}`} />
                    </button>

                    {isSpeaking && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPaused) {
                            resumeSpeech();
                            setIsPaused(false);
                          } else {
                            pauseSpeech();
                            setIsPaused(true);
                            if (advanceTimerRef.current) {
                              clearTimeout(advanceTimerRef.current);
                              advanceTimerRef.current = null;
                            }
                          }
                        }}
                        className="tap-bounce inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-2 ring-slate-200 transition hover:ring-[var(--mint-deep)]"
                        title={isPaused ? '이어 듣기' : '일시정지'}
                      >
                        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                )}

                {/* 배경음악 토글 버튼 */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !ambientMusicEnabled;
                      setAmbientMusicEnabled(next);
                      saveAmbientMusicPreference(next);
                      if (next) {
                        startAmbientMusic();
                      } else {
                        stopAmbientMusic();
                      }
                    }}
                    className={`tap-bounce inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition ${
                      ambientMusicEnabled
                        ? 'bg-[var(--mint-deep)] text-white hover:brightness-90'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                    title={ambientMusicEnabled ? '배경음악 끄기' : '배경음악 켜기'}
                  >
                    <Music2 className="h-5 w-5" />
                  </button>
                </div>
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

            {newBadges.length > 0 ? (
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-[var(--peach)]/40 to-[var(--mint)]/40 p-5">
                <p className="text-lg font-black text-slate-800">🎉 새 배지를 획득했어요!</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {newBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="animate-float rounded-xl border-3 border-white/80 bg-white/90 px-4 py-3 text-center shadow-md"
                    >
                      <div className="text-3xl">{badge.emoji}</div>
                      <p className="mt-1 text-xs font-bold text-slate-700">{badge.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {story ? (
              <ExportButtons story={story} onOpenPricing={() => setShowPricingModal(true)} />
            ) : null}

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

        {showLibrary ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border-4 border-white/70 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-lg font-black text-slate-800">
                  <BookOpen className="h-5 w-5" />
                  저장된 동화
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibrary(false)}
                  className="tap-bounce inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--mint)]/60 p-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <CalendarCheck className="h-5 w-5 text-[var(--mint-deep)]" />
                  <span className="text-2xl font-black text-slate-800">{completionStats.thisWeekCount}편</span>
                  <span className="text-xs font-semibold text-slate-600">이번 주 읽었어요</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-l border-white/70 text-center">
                  <BookOpen className="h-5 w-5 text-[var(--mint-deep)]" />
                  <span className="text-2xl font-black text-slate-800">{completionStats.totalCount}편</span>
                  <span className="text-xs font-semibold text-slate-600">누적 완독</span>
                </div>
              </div>

              {/* 배지 컬렉션 섹션 */}
              <div className="mb-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
                <h3 className="text-sm font-black text-slate-800">배지 컬렉션 🏅</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BADGE_DEFINITIONS.map((badge) => {
                    const isEarned = earnedBadges.some((b) => b.id === badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition ${
                          isEarned
                            ? 'border-amber-300 bg-white/80'
                            : 'border-slate-200 bg-slate-50 opacity-50'
                        }`}
                      >
                        <span className={isEarned ? 'text-2xl' : 'text-2xl grayscale'}>{badge.emoji}</span>
                        <p className="text-xs font-semibold text-slate-700">{badge.label}</p>
                        {!isEarned && (
                          <p className="mt-1 text-xs text-slate-500">{badge.threshold}편 읽으면</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {savedStories.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  아직 완성한 동화가 없어요. 동화를 끝까지 읽으면 자동으로 저장돼요.
                </p>
              ) : (
                <ul className="space-y-3">
                  {savedStories.map((saved) => (
                    <li
                      key={saved.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-700">
                          {saved.childName} · {saved.topic}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(saved.savedAt).toLocaleString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadSaved(saved)}
                          className="tap-bounce inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint-deep)] text-white shadow"
                          title="다시 보기"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(saved.id)}
                          className="tap-bounce inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {showParentGate ? (
          <ParentGate onSuccess={handleParentGateSuccess} onClose={() => setShowParentGate(false)} />
        ) : null}

        {showParentSettings ? (
          <ParentSettingsPanel onClose={() => setShowParentSettings(false)} />
        ) : null}

        {/* 인증 및 결제 모달 */}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      </div>
    </main>
  );
}
