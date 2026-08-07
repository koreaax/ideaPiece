'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Users,
  CreditCard,
  Crown,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { useSupabase } from '../../contexts/supabase-context';

type Stats = {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  adminUsers: number;
  subscriptionStatus: {
    active: number;
    canceled: number;
    past_due: number;
    none: number;
  };
};

type AdminUser = {
  id: string;
  email: string | null;
  plan: string;
  role: string;
  subscription_status: string | null;
  subscription_end_at: string | null;
  created_at: string;
};

type ErrorLog = {
  id: string;
  created_at: string;
  route: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown> | null;
};

function planBadgeClass(plan: string) {
  if (plan === 'premium') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function roleBadgeClass(role: string) {
  if (role === 'admin') return 'bg-indigo-100 text-indigo-700';
  return 'bg-slate-100 text-slate-600';
}

function statusBadgeClass(status: string | null) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'canceled') return 'bg-rose-100 text-rose-700';
  if (status === 'past_due') return 'bg-orange-100 text-orange-700';
  return 'bg-slate-100 text-slate-500';
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const { profile, loading } = useSupabase();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    async function loadAll() {
      setDataLoading(true);
      setDataError('');
      try {
        const [statsRes, usersRes, logsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/logs'),
        ]);

        const [statsJson, usersJson, logsJson] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          logsRes.json(),
        ]);

        if (!statsRes.ok) throw new Error(statsJson.error || '통계 조회에 실패했습니다.');
        if (!usersRes.ok) throw new Error(usersJson.error || '사용자 목록 조회에 실패했습니다.');
        if (!logsRes.ok) throw new Error(logsJson.error || '에러 로그 조회에 실패했습니다.');

        if (isMounted) {
          setStats(statsJson as Stats);
          setUsers((usersJson.users ?? []) as AdminUser[]);
          setLogs((logsJson.logs ?? []) as ErrorLog[]);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '데이터 조회 중 오류가 발생했습니다.';
          setDataError(message);
        }
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
        <div className="w-full max-w-sm rounded-3xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-400" />
          <h1 className="text-lg font-black text-slate-800">관리자 권한이 필요합니다</h1>
          <p className="mt-2 text-sm text-slate-500">
            이 페이지는 관리자 계정으로만 접근할 수 있어요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 text-sm font-bold text-white hover:brightness-95"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[var(--mint-deep)]" />
            <h1 className="text-2xl font-black text-slate-800">관리자 대시보드</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            홈으로 돌아가기
          </Link>
        </div>

        {dataError ? (
          <div className="mb-6 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            {dataError}
          </div>
        ) : null}

        {dataLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* 통계 카드 섹션 */}
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-black text-slate-500">전체 통계</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    전체 가입자
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-800">
                    {stats?.totalUsers ?? 0}
                  </div>
                </div>
                <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    무료 플랜
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-800">
                    {stats?.freeUsers ?? 0}
                  </div>
                </div>
                <div className="rounded-3xl border-2 border-amber-200 bg-amber-50/60 p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <Crown className="h-3.5 w-3.5" />
                    프리미엄
                  </div>
                  <div className="mt-1 text-2xl font-black text-amber-800">
                    {stats?.premiumUsers ?? 0}
                  </div>
                </div>
                <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    관리자
                  </div>
                  <div className="mt-1 text-2xl font-black text-indigo-800">
                    {stats?.adminUsers ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <CreditCard className="h-3.5 w-3.5" />
                  구독 상태
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  활성 {stats?.subscriptionStatus.active ?? 0}
                </span>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                  해지 {stats?.subscriptionStatus.canceled ?? 0}
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  연체 {stats?.subscriptionStatus.past_due ?? 0}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  없음 {stats?.subscriptionStatus.none ?? 0}
                </span>
              </div>
            </section>

            {/* 사용자 목록 섹션 */}
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-black text-slate-500">
                사용자 목록 ({users.length}명)
              </h2>
              <div className="overflow-x-auto rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-xs font-bold text-slate-500">
                      <th className="px-4 py-3">이메일</th>
                      <th className="px-4 py-3">플랜</th>
                      <th className="px-4 py-3">권한</th>
                      <th className="px-4 py-3">구독 상태</th>
                      <th className="px-4 py-3">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {u.email ?? '(이메일 없음)'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${planBadgeClass(u.plan)}`}
                          >
                            {u.plan === 'premium' ? '프리미엄' : '무료'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleBadgeClass(u.role)}`}
                          >
                            {u.role === 'admin' ? '관리자' : '사용자'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(u.subscription_status)}`}
                          >
                            {u.subscription_status ?? '없음'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                          사용자가 없습니다.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 에러 로그 섹션 */}
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                최근 에러 로그 ({logs.length}건)
              </h2>
              <div className="space-y-2">
                {logs.map((log) => (
                  <details
                    key={log.id}
                    className="rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400">{formatDate(log.created_at)}</span>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-600">
                          {log.route}
                        </span>
                        <span className="font-semibold text-slate-700">{log.message}</span>
                      </div>
                    </summary>
                    {log.stack ? (
                      <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
                        {log.stack}
                      </pre>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">스택 정보가 없습니다.</p>
                    )}
                    {log.context ? (
                      <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-100 p-3 text-[11px] leading-relaxed text-slate-600">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    ) : null}
                  </details>
                ))}
                {logs.length === 0 ? (
                  <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                    최근 에러 로그가 없습니다.
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
