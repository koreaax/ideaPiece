'use client';

import React from 'react';
import { Lock, X } from 'lucide-react';
import { generateParentCheckQuestion } from '../lib/parent-mode';

type ParentGateProps = {
  onSuccess: () => void;
  onClose: () => void;
};

/**
 * 부모 확인 모달. 랜덤 두 자리 덧셈 문제를 보여주고 정답 입력 시 통과시킨다.
 * 아이가 우연히 통과하기 어렵게 매번 새로운 숫자 조합을 사용한다.
 */
export default function ParentGate({ onSuccess, onClose }: ParentGateProps) {
  const [question, setQuestion] = React.useState(() => generateParentCheckQuestion());
  const [answer, setAnswer] = React.useState('');
  const [error, setError] = React.useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = Number.parseInt(answer, 10);
    if (Number.isFinite(value) && value === question.answer) {
      onSuccess();
      return;
    }

    setError('정답이 아니에요. 다시 시도해 주세요.');
    setAnswer('');
    setQuestion(generateParentCheckQuestion());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-[2rem] border-4 border-white/70 bg-white/95 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-lg font-black text-slate-800">
            <Lock className="h-5 w-5" />
            부모 확인
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-bounce inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">아래 계산 문제를 풀면 부모 설정으로 이동해요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-5 text-center">
            <p className="text-3xl font-black text-slate-800">
              {question.a} + {question.b} = ?
            </p>
          </div>

          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="정답을 입력하세요"
            className="h-14 w-full rounded-3xl border-2 border-slate-200 bg-white px-5 text-center text-xl outline-none transition focus:border-[var(--mint-deep)]"
          />

          {error ? <p className="rounded-xl bg-rose-100 px-4 py-3 text-center text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            className="tap-bounce flex h-14 w-full items-center justify-center rounded-[2rem] bg-[var(--mint-deep)] text-lg font-black text-white shadow-lg"
          >
            확인
          </button>
        </form>
      </div>
    </div>
  );
}
