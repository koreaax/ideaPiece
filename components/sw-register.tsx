'use client';

import { useEffect } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // 개발 중에는 서비스워커가 캐시로 방해하지 않도록 프로덕션에서만 등록한다.
    if (process.env.NODE_ENV !== 'production') return;

    const swUrl = `${basePath}/sw.js`;
    const scope = `${basePath}/`;

    navigator.serviceWorker
      .register(swUrl, { scope })
      .then((registration) => {
        console.log('[SW] registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] registration failed:', error);
      });
  }, []);

  return null;
}
