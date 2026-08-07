/**
 * 동화 PDF Export 검증 API
 * POST /api/export/pdf
 * 유료 사용자만 이용 가능
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
        { error: 'PDF 저장 기능은 프리미엄 유료 회원 전용입니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.scenes || !Array.isArray(body.scenes)) {
      return NextResponse.json({ error: '올바른 동화 데이터가 아닙니다.' }, { status: 400 });
    }

    return NextResponse.json({
      allowed: true,
      message: 'PDF 생성 권한이 확인되었습니다.',
    });
  } catch (error) {
    console.error('[PDF Export Verify]', error);
    await logServerError('/api/export/pdf', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
