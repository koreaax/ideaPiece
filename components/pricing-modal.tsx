'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Check, Sparkles, Crown, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useSupabase } from '../contexts/supabase-context';

type PricingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
};

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_docs_OaPz8L5daMy4W3ADn0y81控'; // 테스트 클라이언트키

export default function PricingModal({ isOpen, onClose, onOpenAuth }: PricingModalProps) {
  const { user, profile, refreshProfile } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // 토스 리다이렉트 성공 감지 (authKey쿼리가 들어왔을 때)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const authKey = urlParams.get('authKey');
    const customerKey = urlParams.get('customerKey');

    if (authKey && customerKey && user) {
      setLoading(true);
      setStatusMessage('결제 승인 처리 중입니다...');

      fetch('/api/toss/issue-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey, customerKey }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || '결제 승인에 실패했습니다.');
          setStatusMessage('🎉 프리미엄 결제가 완료되었습니다!');
          await refreshProfile();
          // URL 정리
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err) => {
          setError(err.message || '결제 승인 중 오류가 발생했습니다.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, refreshProfile]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setError('');
    if (!user) {
      onClose();
      onOpenAuth();
      return;
    }

    setLoading(true);

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const customerKey = `user_${user.id.replace(/-/g, '')}`;

      // 빌링키 발급 요청 (자동결제 카드 등록)
      await tossPayments.requestBillingAuth('카드', {
        customerKey,
        successUrl: `${window.location.origin}${window.location.pathname}`,
        failUrl: `${window.location.origin}${window.location.pathname}`,
      });
    } catch (err) {
      console.error('[Toss Billing Auth Error]', err);
      const msg = err instanceof Error ? err.message : '토스 결제창을 불러올 수 없습니다.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setError('');
    const confirmed = window.confirm('정말 구독을 해지하시겠어요? 남은 기간 동안은 계속 이용하실 수 있어요.');
    if (!confirmed) return;

    setCancelLoading(true);
    try {
      const res = await fetch('/api/toss/cancel-subscription', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '구독 해지에 실패했습니다.');
      setStatusMessage(data.message);
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '구독 해지 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const isPremiumPlan = profile?.plan === 'premium';
  const isAdminUser = profile?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border-4 border-white/80 bg-white p-6 sm:p-8 shadow-2xl transition-all">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-800">
            <Crown className="h-4 w-4 text-amber-600" />
            Fairytale IdeaPiece 멤버십
          </div>
          <h2 className="text-3xl font-black text-slate-800">
            우리 아이 맞춤 동화 멤버십
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            무제한 AI 동화 생성과 다양한 오디오/PDF 저장 기능으로 아이의 창의력을 키워주세요!
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-600">
            {error}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {/* 무료 플랜 */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-slate-200 bg-slate-50/80 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-700">무료 체험</span>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                  Basic
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-800">0원</div>
              <p className="mt-1 text-xs text-slate-500">기본 동화 경험 제공</p>

              <ul className="mt-5 space-y-2.5 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  하루 1편 생성 (기본 동화)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  기본 캐릭터 2종
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  기본 Web TTS 음성 지원
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-slate-300 shrink-0" />
                  커스텀 주제 직접 입력
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-slate-300 shrink-0" />
                  PDF / MP3 다운로드
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-slate-300 bg-slate-200 text-xs font-bold text-slate-600"
            >
              현재 플랜
            </button>
          </div>

          {/* 프리미엄 플랜 (토스 결제) */}
          <div className="relative flex flex-col justify-between rounded-3xl border-3 border-[var(--mint-deep)] bg-gradient-to-b from-white to-[var(--mint)]/20 p-5 shadow-lg">
            <div className="absolute -top-3 right-5 rounded-full bg-[var(--mint-deep)] px-3 py-1 text-xs font-black text-white shadow">
              추천 👍
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-base font-black text-slate-800">프리미엄 멤버십</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">월 5,900원</span>
                <span className="text-xs text-slate-500">/월</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">무제한 LLM 동화 & 오디오 다운로드</p>

              <ul className="mt-5 space-y-2.5 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--mint-deep)] shrink-0" />
                  하루 무제한 LLM 동화 생성
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--mint-deep)] shrink-0" />
                  캐릭터 전종 + 프리미엄 배경
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--mint-deep)] shrink-0" />
                  커스텀 주제 자유 입력
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--mint-deep)] shrink-0" />
                  고품질 OpenAI MP3 음성 다운로드
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--mint-deep)] shrink-0" />
                  동화책 PDF 인쇄 저장
                </li>
              </ul>
            </div>

            {isAdminUser ? (
              <div className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow">
                <ShieldCheck className="h-4 w-4" />
                관리자 권한으로 무료 이용 중
              </div>
            ) : isPremiumPlan && profile?.subscription_status !== 'canceled' ? (
              <div className="mt-6">
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-bold text-white shadow">
                  <ShieldCheck className="h-4 w-4" />
                  프리미엄 이용 중
                </div>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="mt-2 w-full text-center text-xs font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-500 disabled:opacity-50"
                >
                  {cancelLoading ? '해지 처리 중...' : '구독 해지하기'}
                </button>
              </div>
            ) : isPremiumPlan && profile?.subscription_status === 'canceled' ? (
              <div className="mt-6 flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl bg-slate-100 px-2 text-center text-xs font-bold text-slate-600 shadow">
                <span>구독이 해지되었습니다.</span>
                <span>
                  {profile?.subscription_end_at
                    ? `${new Date(profile.subscription_end_at).toLocaleDateString('ko-KR')} 까지 이용 가능해요`
                    : ''}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={loading}
                className="tap-bounce mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mint-deep)] text-sm font-black text-white shadow-md hover:brightness-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    토스 결제 진행 중...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-current" />
                    토스페이먼츠로 5,900원 결제
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          토스페이먼츠 보안 결제로 언제든지 해지할 수 있습니다.
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <Link href="/terms" target="_blank" className="hover:text-slate-600 hover:underline">
            이용약관
          </Link>
          <span>·</span>
          <Link href="/privacy" target="_blank" className="hover:text-slate-600 hover:underline">
            개인정보처리방침
          </Link>
          <span>·</span>
          <Link href="/refund" target="_blank" className="hover:text-slate-600 hover:underline">
            환불정책
          </Link>
        </div>
      </div>
    </div>
  );
}
