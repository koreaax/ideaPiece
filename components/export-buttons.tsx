'use client';

import React, { useState } from 'react';
import { Download, FileText, Music, Loader2, Lock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { StoryPayload } from '../lib/story-types';
import { useSupabase } from '../contexts/supabase-context';

type ExportButtonsProps = {
  story: StoryPayload;
  onOpenPricing: () => void;
};

export default function ExportButtons({ story, onOpenPricing }: ExportButtonsProps) {
  const { profile } = useSupabase();
  const isPremium = profile?.plan === 'premium' || profile?.role === 'admin';

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingMp3, setDownloadingMp3] = useState(false);
  const [statusError, setStatusError] = useState('');

  // 1. PDF 클라이언트 내보내기 (jsPDF)
  const handleExportPdf = async () => {
    setStatusError('');
    if (!isPremium) {
      onOpenPricing();
      return;
    }

    setDownloadingPdf(true);

    try {
      // 서버에서 권한 확인
      const verifyRes = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: story.scenes }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'PDF 저장 권한이 없습니다.');
      }

      // jsPDF 문서 생성 (A4 가로 모드: 297mm x 210mm)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // 커버 페이지
      doc.setFillColor(254, 249, 231); // #fef9e7
      doc.rect(0, 0, 297, 210, 'F');

      doc.setFontSize(28);
      doc.setTextColor(47, 133, 90);
      doc.text(`${story.child_name}의 맞춤 동화책`, 148.5, 90, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(100, 116, 139);
      doc.text(`Fairytale IdeaPiece`, 148.5, 120, { align: 'center' });

      // 씬 페이지 추가
      story.scenes.forEach((scene) => {
        doc.addPage('a4', 'landscape');
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 297, 210, 'F');

        // 상단 페이지 번호
        doc.setFontSize(14);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${scene.page}`, 20, 20);

        // 동화 본문 텍스트 (줄바꿈 처리)
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);

        const splitText = doc.splitTextToSize(scene.text, 240);
        doc.text(splitText, 148.5, 100, { align: 'center', lineHeightFactor: 1.5 });
      });

      doc.save(`${story.child_name}_동화책.pdf`);
    } catch (err) {
      console.error('[PDF Export]', err);
      const msg = err instanceof Error ? err.message : 'PDF 생성 실패';
      setStatusError(msg);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 2. MP3 오디오 다운로드 (/api/export/mp3)
  const handleExportMp3 = async () => {
    setStatusError('');
    if (!isPremium) {
      onOpenPricing();
      return;
    }

    setDownloadingMp3(true);

    try {
      const fullText = story.scenes.map((s) => s.text).join(' ');

      const response = await fetch('/api/export/mp3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'MP3 다운로드 실패');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.child_name}_동화_음성.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[MP3 Export]', err);
      const msg = err instanceof Error ? err.message : 'MP3 다운로드 실패';
      setStatusError(msg);
    } finally {
      setDownloadingMp3(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      {statusError ? (
        <div className="rounded-xl bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700">
          {statusError}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={downloadingPdf}
          className="tap-bounce inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:border-[var(--mint-deep)] hover:text-[var(--mint-deep)] transition"
        >
          {downloadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--mint-deep)]" />
          ) : (
            <FileText className="h-4 w-4 text-[var(--mint-deep)]" />
          )}
          <span>PDF 동화책 저장</span>
          {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
        </button>

        <button
          type="button"
          onClick={handleExportMp3}
          disabled={downloadingMp3}
          className="tap-bounce inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:border-[var(--peach)] hover:text-amber-700 transition"
        >
          {downloadingMp3 ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          ) : (
            <Music className="h-4 w-4 text-amber-600" />
          )}
          <span>고품질 MP3 음성</span>
          {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
        </button>
      </div>
    </div>
  );
}
