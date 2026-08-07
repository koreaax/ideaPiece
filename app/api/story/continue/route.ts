import { NextResponse } from 'next/server';
import { generateJsonWithLlm } from '../../../../lib/llm';
import { createContinuationSystemPrompt, createContinuationUserPrompt } from '../../../../lib/story-prompt';
import {
  buildFallbackContinuation,
  extractJsonString,
  normalizeContinuation,
  normalizeSettings,
  normalizeIntroStory,
} from '../../../../lib/story-utils';
import { StoryPayload } from '../../../../lib/story-types';
import { createClient } from '../../../../lib/supabase-server';
import { checkAndIncrementIpUsage, extractClientIp } from '../../../../lib/rate-limit';
import { getMyProfile, isPremium } from '../../../../lib/plan';
import { logServerError } from '../../../../lib/error-log';

type ContinueRequest = {
  story?: unknown;
  selectedChoice?: string;
  settings?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContinueRequest;
    const selectedChoice = typeof body.selectedChoice === 'string' ? body.selectedChoice.trim() : '';
    const settings = normalizeSettings(body.settings);

    if (!body.story || typeof body.story !== 'object') {
      return NextResponse.json({ error: 'story가 필요합니다.' }, { status: 400 });
    }

    const clientIp = extractClientIp(request);
    const rateLimitResult = await checkAndIncrementIpUsage(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    const baseStory = normalizeIntroStory(body.story, '친구', '오늘의 모험', settings.style);
    const choice = selectedChoice || baseStory.interact_choices[0]?.button_text || '숲속으로 가기';

    const supabase = await createClient();
    const profile = await getMyProfile(supabase);
    const isUserPremium = await isPremium(supabase);
    const planLabel = profile?.role === 'admin' ? 'admin' : 'premium';

    // 무료 회원인 경우 fallback 이어쓰기 반환
    if (!isUserPremium) {
      const fallback = buildFallbackContinuation(baseStory, choice, settings.style);
      return NextResponse.json({
        continuation: fallback,
        meta: { source: 'free-plan-fallback', plan: 'free' },
      });
    }

    // 유료 회원인 경우 LLM으로 후속 씬 생성
    const systemPrompt = createContinuationSystemPrompt(settings.style);
    const userPrompt = createContinuationUserPrompt(baseStory as StoryPayload, choice);

    const llmResult = await generateJsonWithLlm({
      systemPrompt,
      userPrompt,
      settings,
    });

    if (!llmResult) {
      const fallback = buildFallbackContinuation(baseStory, choice, settings.style);
      return NextResponse.json({
        continuation: fallback,
        meta: { source: 'fallback-no-provider', plan: planLabel },
      });
    }

    const parsed = JSON.parse(extractJsonString(llmResult.raw));
    const continuation = normalizeContinuation(parsed, baseStory, choice, settings.style);

    return NextResponse.json({
      continuation,
      meta: {
        source: 'llm',
        provider: llmResult.provider,
        model: llmResult.model,
        plan: planLabel,
      },
    });
  } catch (error) {
    console.error('Story continuation API error:', error);
    await logServerError('/api/story/continue', error);

    const baseStory = normalizeIntroStory({}, '친구', '오늘의 모험', 'playful');
    const fallback = buildFallbackContinuation(baseStory, '숲속으로 가기', 'playful');

    return NextResponse.json({
      continuation: fallback,
      meta: { source: 'fallback-error' },
    });
  }
}
