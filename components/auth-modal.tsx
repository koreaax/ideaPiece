'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Mail, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { createClient } from '../lib/supabase';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  if (!isOpen) return null;

  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpErr) throw signUpErr;
        setMessage('가입 확인 이메일이 전송되었습니다! 이메일을 확인해 주세요.');
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) throw signInErr;
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (googleErr) throw googleErr;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google 로그인 오류';
      setError(msg);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!resetEmail) {
      setError('이메일을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetErr) throw resetErr;
      setMessage('비밀번호 재설정 링크를 이메일로 보내드렸어요. 메일함을 확인해 주세요.');
      setResetEmail('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '재설정 이메일 발송 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border-4 border-white/80 bg-white p-6 shadow-2xl transition-all">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mint)]/60 text-[var(--mint-deep)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {showForgotPassword ? '비밀번호 재설정' : isSignUp ? '계정 만들기' : '로그인'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            동화를 무제한 저장하고 프리미엄 기능을 이용하세요!
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-center text-xs font-semibold text-rose-600">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        {!showForgotPassword && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="tap-bounce mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-slate-300 shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Google 계정으로 계속하기
            </button>

            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">또는 이메일</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        {showForgotPassword ? (
          <form onSubmit={handlePasswordResetRequest} className="space-y-3">
            <p className="mb-4 text-center text-xs text-slate-600">
              가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드려요.
            </p>
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-[var(--mint-deep)] focus:bg-white"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="tap-bounce flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mint-deep)] text-base font-bold text-white shadow-md disabled:opacity-50"
            >
              {loading ? '전송 중...' : '재설정 링크 보내기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-[var(--mint-deep)] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-[var(--mint-deep)] focus:bg-white"
                />
              </div>
            </div>

            {isSignUp ? (
              <p className="px-1 text-center text-[11px] leading-relaxed text-slate-400">
                가입 시{' '}
                <Link href="/terms" target="_blank" className="font-semibold text-slate-500 underline hover:text-slate-700">
                  이용약관
                </Link>
                과{' '}
                <Link href="/privacy" target="_blank" className="font-semibold text-slate-500 underline hover:text-slate-700">
                  개인정보처리방침
                </Link>
                에 동의하는 것으로 간주됩니다.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="tap-bounce flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mint-deep)] text-base font-bold text-white shadow-md disabled:opacity-50"
            >
              {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          {showForgotPassword ? (
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setError('');
                setMessage('');
              }}
              className="text-xs font-bold text-slate-600 underline hover:text-slate-800"
            >
              로그인으로 돌아가기
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                }}
                className="text-xs font-bold text-slate-600 underline hover:text-slate-800"
              >
                {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
              </button>
              {!isSignUp && (
                <>
                  <span className="mx-2 text-xs text-slate-400">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setEmail('');
                      setPassword('');
                      setError('');
                      setMessage('');
                    }}
                    className="text-xs font-bold text-slate-600 underline hover:text-slate-800"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
