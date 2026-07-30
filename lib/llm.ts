import { GenerationSettings } from './story-types';
import { clampTemperature } from './story-utils';

type ProviderResult = {
  raw: string;
  provider: 'openai' | 'gemini';
  model: string;
};

type LlmInput = {
  systemPrompt: string;
  userPrompt: string;
  settings: GenerationSettings;
};

function effectiveProvider(settings: GenerationSettings) {
  const envProvider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  if (settings.provider !== 'auto') return settings.provider;
  if (envProvider === 'openai' || envProvider === 'gemini') return envProvider;
  return 'auto';
}

function providerOrder(settings: GenerationSettings): Array<'openai' | 'gemini'> {
  const provider = effectiveProvider(settings);
  if (provider === 'openai') return ['openai'];
  if (provider === 'gemini') return ['gemini'];

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (hasOpenAI && hasGemini) return ['openai', 'gemini'];
  if (hasOpenAI) return ['openai'];
  if (hasGemini) return ['gemini'];
  return [];
}

async function callOpenAI(systemPrompt: string, userPrompt: string, settings: GenerationSettings): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is missing.');

  const model = settings.model.trim() || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: clampTemperature(settings.temperature),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('OpenAI response has no content.');
  }

  return { raw: content, provider: 'openai', model };
}

async function callGemini(systemPrompt: string, userPrompt: string, settings: GenerationSettings): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

  const model = settings.model.trim() || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\\n\\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: clampTemperature(settings.temperature),
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini error ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || typeof content !== 'string') {
    throw new Error('Gemini response has no content.');
  }

  return { raw: content, provider: 'gemini', model };
}

export async function generateJsonWithLlm(input: LlmInput): Promise<ProviderResult | null> {
  const order = providerOrder(input.settings);
  if (order.length === 0) return null;

  let lastError: unknown = null;

  for (const provider of order) {
    try {
      if (provider === 'openai') {
        return await callOpenAI(input.systemPrompt, input.userPrompt, input.settings);
      }
      return await callGemini(input.systemPrompt, input.userPrompt, input.settings);
    } catch (error) {
      lastError = error;
      console.error(`[LLM:${provider}]`, error);
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}
