import { NextResponse } from 'next/server';
import { generateJsonWithLlm } from '../../../lib/llm';
import { createIntroSystemPrompt, createIntroUserPrompt } from '../../../lib/story-prompt';
import { buildFallbackIntroStory, extractJsonString, normalizeIntroStory, normalizeSettings } from '../../../lib/story-utils';
import { createClient } from '../../../lib/supabase-server';
import { checkAndIncrementIpUsage, extractClientIp } from '../../../lib/rate-limit';
import { getMyProfile, hasExceededFreeLimit, incrementDailyUsage, isPremium } from '../../../lib/plan';
import { logServerError } from '../../../lib/error-log';

type IntroRequest = {
  childName?: string;
  topic?: string;
  settings?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IntroRequest;
    const childName = typeof body.childName === 'string' ? body.childName.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const settings = normalizeSettings(body.settings);

    if (!childName || !topic) {
      return NextResponse.json({ error: '아이 이름과 주제를 입력해 주세요.' }, { status: 400 });
    }

    const clientIp = extractClientIp(request);
    const rateLimitResult = await checkAndIncrementIpUsage(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const profile = await getMyProfile(supabase);

    // 무료 플랜이거나 미로그인 유저인 경우 (ADMIN_EMAILS 관리자는 isPremium 헬퍼가 자동으로 프리미엄 취급)
    const isUserPremium = await isPremium(supabase);
    const planLabel = profile?.role === 'admin' ? 'admin' : 'premium';

    if (!isUserPremium) {
      if (profile?.id) {
        const exceeded = await hasExceededFreeLimit(supabase, profile.id);
        if (exceeded) {
          return NextResponse.json(
            { error: '무료 플랜의 오늘 생성 횟수(1편)를 모두 사용하셨습니다. 프리미엄으로 업그레이드해보세요! 🚀', isLimitReached: true },
            { status: 403 }
          );
        }
        await incrementDailyUsage(supabase, profile.id);
      }

      // 무료 플랜은 fallback 동화 제공
      const fallback = buildFallbackIntroStory(childName, topic, settings.style);
      return NextResponse.json({
        story: fallback,
        meta: { source: 'free-plan-fallback', plan: 'free' },
      });
    }

    // 유료 회원: 실제 LLM 동화 생성
    const systemPrompt = createIntroSystemPrompt(settings.style);
    const userPrompt = createIntroUserPrompt(childName, topic);

    const llmResult = await generateJsonWithLlm({
      systemPrompt,
      userPrompt,
      settings,
    });

    if (!llmResult) {
      const fallback = buildFallbackIntroStory(childName, topic, settings.style);
      return NextResponse.json({
        story: fallback,
        meta: { source: 'fallback-no-provider', plan: planLabel },
      });
    }

    const parsed = JSON.parse(extractJsonString(llmResult.raw));
    const story = normalizeIntroStory(parsed, childName, topic, settings.style);

    return NextResponse.json({
      story,
      meta: {
        source: 'llm',
        provider: llmResult.provider,
        model: llmResult.model,
        plan: planLabel,
      },
    });
  } catch (error) {
    console.error('Story API error:', error);
    await logServerError('/api/story', error);

    const fallback = buildFallbackIntroStory('친구', '오늘의 모험', 'playful');
    return NextResponse.json({
      story: fallback,
      meta: { source: 'fallback-error' },
    });
  }
}
