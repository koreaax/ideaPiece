'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (err) {
        setIsValidSession(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      setMessage('비밀번호가 변경되었습니다!');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '비밀번호 변경 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
        <div className="w-full max-w-md rounded-[2rem] border-4 border-white/70 bg-white/90 p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--mint-deep)]" />
            <p className="text-sm text-slate-600">확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
        <div className="w-full max-w-md rounded-[2rem] border-4 border-white/70 bg-white/90 p-6 shadow-xl">
          <div className="mb-4 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
            <h2 className="text-xl font-black text-slate-800">유효하지 않은 접근입니다</h2>
          </div>
          <p className="mb-6 text-center text-sm text-slate-600">
            이메일의 재설정 링크를 다시 확인해 주세요.
          </p>
          <a
            href="/"
            className="tap-bounce flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--mint-deep)] text-base font-bold text-white shadow-md"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
      <div className="w-full max-w-md rounded-[2rem] border-4 border-white/70 bg-white/90 p-6 shadow-xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mint)]/60 text-[var(--mint-deep)]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">비밀번호 변경</h2>
          <p className="mt-1 text-xs text-slate-500">
            새로운 비밀번호를 입력해 주세요.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-center text-xs font-semibold text-rose-600">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            {message}
          </div>
        ) : null}

        <form onSubmit={handleResetPassword} className="space-y-3">
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="새 비밀번호"
                className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-[var(--mint-deep)] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
                className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-[var(--mint-deep)] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tap-bounce flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mint-deep)] text-base font-bold text-white shadow-md disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <a href="/" className="text-xs font-bold text-slate-600 underline hover:text-slate-800">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
