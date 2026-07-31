'use client';

import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// BeforeInstallPromptEvent 인터페이스 정의
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 이미 standalone 모드로 실행 중인지 확인
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    // appinstalled 이벤트 리스너 (설치 완료 후)
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 설치 프롬프트 표시
    await deferredPrompt.prompt();

    // 사용자 선택 결과 확인
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[InstallPrompt] App installed');
    } else {
      console.log('[InstallPrompt] Installation dismissed');
    }

    // 프롬프트 사용 후 초기화
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  // beforeinstallprompt 이벤트가 발생하지 않았거나, 이미 설치된 경우 렌더링하지 않음
  if (!showPrompt) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className="tap-bounce inline-flex items-center gap-1 rounded-full bg-[var(--mint-deep)] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
      title="앱을 홈 화면에 추가하면 더 빠르게 접속할 수 있어요!"
    >
      <Download className="h-4 w-4" />
      홈 화면에 추가
    </button>
  );
}
