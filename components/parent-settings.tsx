'use client';

import React from 'react';
import { Bell, BellOff, Clock, RotateCcw, Settings, X } from 'lucide-react';
import {
  ParentSettings,
  getParentSettings,
  getTodayUsageMs,
  resetTodayUsage,
  saveParentSettings,
} from '../lib/parent-mode';
import {
  ReminderSettings,
  getReminderSettings,
  isNotificationSupported,
  requestNotificationPermission,
  saveReminderSettings,
} from '../lib/reminder';

type ParentSettingsProps = {
  onClose: () => void;
};

const LIMIT_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '15분', value: 15 },
  { label: '30분', value: 30 },
  { label: '60분', value: 60 },
  { label: '무제한', value: null },
];

function formatMinutes(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (totalMinutes <= 0) return `${seconds}초`;
  return `${totalMinutes}분 ${seconds}초`;
}

/**
 * 부모 게이트 통과 후 보여줄 설정 패널.
 * 하루 사용 제한 시간 설정, 오늘 누적 사용 시간 표시, 사용 시간 초기화 기능 제공.
 */
export default function ParentSettingsPanel({ onClose }: ParentSettingsProps) {
  const [settings, setSettings] = React.useState<ParentSettings>(() => getParentSettings());
  const [usedMs, setUsedMs] = React.useState(() => getTodayUsageMs());
  const [reminder, setReminder] = React.useState<ReminderSettings>(() => getReminderSettings());
  const [reminderNotice, setReminderNotice] = React.useState<string | null>(null);
  const notificationSupported = React.useMemo(() => isNotificationSupported(), []);

  function handleSelectLimit(value: number | null) {
    const next: ParentSettings = { dailyLimitMinutes: value };
    setSettings(next);
    saveParentSettings(next);
  }

  function handleReset() {
    resetTodayUsage();
    setUsedMs(getTodayUsageMs());
  }

  async function handleToggleReminder() {
    if (reminder.enabled) {
      const next: ReminderSettings = { ...reminder, enabled: false };
      setReminder(next);
      saveReminderSettings(next);
      setReminderNotice(null);
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      setReminderNotice('브라우저 알림이 꺼져있어요. 브라우저 설정에서 알림을 허용해주세요.');
      return;
    }

    const next: ReminderSettings = { ...reminder, enabled: true };
    setReminder(next);
    saveReminderSettings(next);
    setReminderNotice(null);
  }

  function handleChangeReminderTime(event: React.ChangeEvent<HTMLInputElement>) {
    const [hourStr, minuteStr] = event.target.value.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return;

    const next: ReminderSettings = { ...reminder, hour, minute };
    setReminder(next);
    saveReminderSettings(next);
  }

  const limitMs = settings.dailyLimitMinutes !== null ? settings.dailyLimitMinutes * 60 * 1000 : null;
  const progressRatio = limitMs ? Math.min(100, Math.round((usedMs / limitMs) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[2rem] border-4 border-white/70 bg-white/95 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-lg font-black text-slate-800">
            <Settings className="h-5 w-5" />
            부모 설정
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-bounce inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Clock className="h-4 w-4" />
              하루 사용 제한 시간
            </p>
            <div className="grid grid-cols-4 gap-2">
              {LIMIT_OPTIONS.map((option) => {
                const active = settings.dailyLimitMinutes === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelectLimit(option.value)}
                    className={`tap-bounce rounded-2xl border-2 px-2 py-3 text-sm font-bold ${
                      active
                        ? 'border-[var(--mint-deep)] bg-[var(--mint)]/70 text-slate-800 shadow-lg'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--mint)]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
              <span>오늘 사용 시간</span>
              <span>{formatMinutes(usedMs)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[var(--mint-deep)] transition-all"
                style={{ width: limitMs ? `${progressRatio}%` : '100%' }}
              />
            </div>
            {limitMs ? (
              <p className="mt-2 text-xs text-slate-500">
                하루 제한 {settings.dailyLimitMinutes}분 중 {progressRatio}% 사용했어요.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">현재 무제한으로 설정되어 있어요.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="tap-bounce flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-[var(--peach)]"
          >
            <RotateCcw className="h-4 w-4" />
            사용 시간 초기화
          </button>

          <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              {reminder.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              오늘의 동화 시간 알림
            </p>
            {notificationSupported ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {reminder.enabled ? '알림이 켜져있어요' : '알림이 꺼져있어요'}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleReminder}
                    className={`tap-bounce inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold ${
                      reminder.enabled
                        ? 'bg-[var(--mint-deep)] text-white shadow-lg'
                        : 'border-2 border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {reminder.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    {reminder.enabled ? '켜짐' : '꺼짐'}
                  </button>
                </div>
                {reminder.enabled ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">알림 시각</span>
                    <input
                      type="time"
                      value={`${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`}
                      onChange={handleChangeReminderTime}
                      className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                    />
                  </div>
                ) : null}
                {reminderNotice ? (
                  <p className="text-xs font-bold text-[var(--peach)]">{reminderNotice}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-500">이 브라우저는 알림을 지원하지 않아요.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
