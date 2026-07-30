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
      return NextResponse.json({ error: 'story is required.' }, { status: 400 });
    }

    const baseStory = normalizeIntroStory(body.story, '친구', '오늘의 모험', settings.style);
    const choice = selectedChoice || baseStory.interact_choices[0]?.button_text || '숲속으로 가기';

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
        meta: { source: 'fallback-no-provider' },
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
      },
    });
  } catch (error) {
    console.error('Story continuation API error:', error);

    const baseStory = normalizeIntroStory({}, '친구', '오늘의 모험', 'playful');
    const fallback = buildFallbackContinuation(baseStory, '숲속으로 가기', 'playful');

    return NextResponse.json({
      continuation: fallback,
      meta: { source: 'fallback-error' },
    });
  }
}
