'use client';

import { useEffect } from 'react';
import { checkAndFireReminder } from '../lib/reminder';

const CHECK_INTERVAL_MS = 60000;

/**
 * 화면에 아무것도 렌더링하지 않고, 백그라운드에서 설정된 리마인더 시각을
 * 주기적으로 체크해 조건이 맞으면 Notification을 띄우는 클라이언트 컴포넌트.
 */
export default function ReminderScheduler() {
  useEffect(() => {
    checkAndFireReminder();

    const intervalId = window.setInterval(() => {
      checkAndFireReminder();
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
