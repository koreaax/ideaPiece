import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>

        <div className="rounded-[2rem] border-4 border-white/70 bg-white/90 p-6 shadow-xl sm:p-10">
          <h1 className="mb-1 text-2xl font-black text-slate-800 sm:text-3xl">환불정책</h1>
          <p className="mb-8 text-sm text-slate-500">
            본 환불정책은 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령을 기준으로
            작성되었으며, Fairytale IdeaPiece 프리미엄 멤버십(월 5,900원 정기결제)에 적용됩니다.
          </p>

          <div className="space-y-7 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제1조 (환불 정책 개요)</h2>
              <p>
                회사는 관련 법령에 따라 정당한 사유가 있는 경우 이용자에게 결제 금액을 환불합니다.
                프리미엄 멤버십은 토스페이먼츠를 통한 자동 정기결제(구독) 상품이며, 아래 각 조항에 따라
                환불 여부와 범위가 달라질 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제2조 (청약철회)</h2>
              <p>
                이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 결제일로부터 7일 이내에
                청약철회를 요청할 수 있으며, 해당 기간 동안 서비스를 실질적으로 이용하지 않은 경우 결제
                금액 전액을 환불받을 수 있습니다.
              </p>
              <p className="mt-2">
                다만, 결제 후 프리미엄 전용 기능(무제한 LLM 동화 생성, 커스텀 주제 입력, 고품질 음성
                MP3·PDF 다운로드 등)을 실질적으로 이용한 경우에는 관련 법령이 허용하는 범위 내에서 청약철회
                및 환불이 제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제3조 (정기결제 해지 시 환불 기준)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  이용자는 서비스 내 &ldquo;구독 해지하기&rdquo; 버튼을 통해 언제든지 정기결제를 해지할 수
                  있습니다.
                </li>
                <li>
                  구독을 해지하면 이미 결제가 완료된 당월 이용료는 환불되지 않으며, 해지 시점 이후에도
                  해당 결제로 확보된 이용기간(구독 만료일)까지는 프리미엄 서비스를 계속 이용하실 수
                  있습니다.
                </li>
                <li>
                  해지 이후에는 자동 재청구가 중단되어 다음 결제일에 요금이 청구되지 않으며, 이용기간
                  종료 시점부터 무료 플랜으로 자동 전환됩니다.
                </li>
                <li>
                  즉, 구독 해지는 &ldquo;즉시 환불&rdquo;이나 &ldquo;즉시 서비스 중단&rdquo;을 의미하지
                  않으며, 이후 결제가 발생하지 않도록 하는 절차입니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제4조 (환불 신청 방법)
              </h2>
              <p>
                청약철회 요건에 해당하여 환불을 원하시는 경우, 아래 고객센터 이메일로 결제 정보(가입
                이메일, 결제일자 등)를 포함하여 환불을 신청해 주세요.
              </p>
              <p className="mt-2 font-semibold">고객센터 이메일: [고객센터 이메일을 입력하세요]</p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제5조 (환불 처리 기간)
              </h2>
              <p>
                환불 요청이 접수되고 요건이 확인되면, 회사는 영업일 기준 3~5일 이내에 환불 처리를
                진행합니다. 다만 결제수단(카드사 등)의 사정에 따라 실제 환불 완료까지 추가 시간이 소요될
                수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제6조 (환불이 제한되는 경우)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>이용자가 프리미엄 전용 기능을 실질적으로 이용한 이후, 법령상 청약철회 제한 사유에 해당하는 경우</li>
                <li>이용자의 약관 위반, 부정 이용(비정상적 다중 계정 생성, 결제 어뷰징 등)으로 서비스 이용이 제한된 경우</li>
                <li>이미 이용기간이 경과하여 서비스 제공이 완료된 부분에 대한 환불 요청인 경우</li>
              </ul>
            </section>

            <section className="border-t border-slate-200 pt-6">
              <h2 className="mb-2 text-lg font-black text-slate-800">사업자 정보</h2>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>상호명: [상호명을 입력하세요]</li>
                <li>대표자: [대표자명을 입력하세요]</li>
                <li>사업자등록번호: [사업자등록번호를 입력하세요]</li>
                <li>통신판매업신고번호: [통신판매업신고번호를 입력하세요]</li>
                <li>주소: [사업장 주소를 입력하세요]</li>
                <li>고객센터 이메일: [고객센터 이메일을 입력하세요]</li>
                <li>고객센터 연락처: [고객센터 연락처를 입력하세요]</li>
              </ul>
              <p className="mt-4 text-xs text-slate-400">시행일: 2026년 8월 7일</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
