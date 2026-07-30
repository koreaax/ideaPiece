import { NextResponse } from 'next/server';
import { generateJsonWithLlm } from '../../../lib/llm';
import { createIntroSystemPrompt, createIntroUserPrompt } from '../../../lib/story-prompt';
import { buildFallbackIntroStory, extractJsonString, normalizeIntroStory, normalizeSettings } from '../../../lib/story-utils';

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
      return NextResponse.json({ error: 'childName and topic are required.' }, { status: 400 });
    }

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
        meta: { source: 'fallback-no-provider' },
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
      },
    });
  } catch (error) {
    console.error('Story API error:', error);

    const fallback = buildFallbackIntroStory('친구', '오늘의 모험', 'playful');
    return NextResponse.json({
      story: fallback,
      meta: { source: 'fallback-error' },
    });
  }
}
