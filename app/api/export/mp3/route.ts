/**
 * 동화 전체 음성 MP3 생성 API
 * POST /api/export/mp3
 * 유료 사용자 전용 (OpenAI TTS-1 모델 사용)
 */
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';
import { isPremium } from '../../../../lib/plan';
import { logServerError } from '../../../../lib/error-log';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const premium = await isPremium(supabase);

    if (!premium) {
      return NextResponse.json(
        { error: 'MP3 다운로드 기능은 프리미엄 유료 회원 전용입니다.' },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: '변환할 동화 텍스트가 없습니다.' }, { status: 400 });
    }

    // OpenAI Audio Speech API 호출
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy', // 따뜻하고 안정적인 목소리
        speed: 0.8, // 느린 읽기 속도 (아이 대상 동화이므로 천천히)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI TTS Error]', errorText);
      return NextResponse.json({ error: '음성 파일 생성에 실패했습니다.' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="fairytale_${Date.now()}.mp3"`,
      },
    });
  } catch (error) {
    console.error('[MP3 Export Error]', error);
    await logServerError('/api/export/mp3', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
