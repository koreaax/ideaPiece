import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <h1 className="mb-1 text-2xl font-black text-slate-800 sm:text-3xl">이용약관</h1>
          <p className="mb-8 text-sm text-slate-500">
            Fairytale IdeaPiece(이하 &ldquo;서비스&rdquo;)를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용과
            관련하여 회사와 이용자의 권리, 의무 및 책임사항을 정합니다.
          </p>

          <div className="space-y-7 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제1조 (목적)</h2>
              <p>
                이 약관은 [상호명을 입력하세요](이하 &ldquo;회사&rdquo;)가 제공하는 &ldquo;Fairytale
                IdeaPiece&rdquo; 서비스(이하 &ldquo;서비스&rdquo;)의 이용조건 및 절차, 회사와 이용자의 권리,
                의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제2조 (정의)</h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  &ldquo;서비스&rdquo;란 회사가 제공하는 만 3세 맞춤형 인터랙티브 동화 생성 및 열람
                  웹서비스를 의미합니다.
                </li>
                <li>&ldquo;이용자&rdquo;란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
                <li>
                  &ldquo;회원&rdquo;이란 이메일 또는 Google 소셜 로그인을 통해 서비스에 가입한 이용자로서,
                  회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
                </li>
                <li>
                  &ldquo;유료회원&rdquo;이란 회원 중 월 정기결제(프리미엄 멤버십)를 통해 유료 서비스를
                  이용하는 자를 말합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제3조 (약관의 효력 및 변경)</h2>
              <p>
                이 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다. 회사는
                관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를
                명시하여 최소 7일 전에 서비스 내 공지합니다. 이용자에게 불리한 내용으로 변경하는 경우에는 최소
                30일 전에 공지합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제4조 (서비스의 제공 및 변경)
              </h2>
              <p>회사는 다음과 같은 서비스를 제공합니다.</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>아이의 이름과 주제를 입력받아 AI가 생성하는 맞춤형 인터랙티브 동화 제공</li>
                <li>문장 하이라이트, 음성 읽어주기, 선택형 분기 스토리 등 부가 기능</li>
                <li>
                  무료 플랜: 하루 1편 생성(기본 캐릭터를 활용한 기본 동화), 기본 Web TTS 음성 지원
                </li>
                <li>
                  프리미엄 플랜(유료): 하루 무제한 실제 LLM 기반 동화 생성, 커스텀 주제 자유 입력, 고품질
                  음성(MP3) 및 동화책 PDF 다운로드 등 추가 기능 제공
                </li>
              </ul>
              <p className="mt-2">
                회사는 서비스의 내용, 운영상 또는 기술상 필요에 따라 제공하는 서비스의 전부 또는 일부를
                변경할 수 있으며, 이 경우 사전에 서비스 내 공지합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제5조 (회원가입)</h2>
              <p>
                이용자는 이메일과 비밀번호를 입력하거나 Google 소셜 로그인을 통해 회원가입을 신청할 수
                있으며, 회사가 이를 승낙함으로써 회원가입이 완료됩니다. 본 서비스는 만 3세 아동을 위한
                콘텐츠를 제공하는 서비스이므로, 회원가입 및 계정 관리는 반드시 보호자(성인)가 진행해야
                합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제6조 (유료 서비스 이용 및 요금)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>프리미엄 멤버십 요금은 월 5,900원이며, 부가세가 포함된 금액입니다.</li>
                <li>
                  결제는 토스페이먼츠(Toss Payments)를 통한 빌링키 기반 자동 정기결제 방식으로
                  이루어지며, 최초 결제일을 기준으로 매월 자동 갱신 및 청구됩니다.
                </li>
                <li>
                  자동 갱신 결제가 실패하는 경우 회사는 일정 기간(유예기간) 동안 재시도할 수 있으며, 유예기간
                  종료 후에도 결제가 이루어지지 않으면 무료 플랜으로 전환됩니다.
                </li>
                <li>요금 정책은 사전 공지를 통해 변경될 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제7조 (구독 해지)</h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>유료회원은 서비스 내 &ldquo;구독 해지하기&rdquo; 기능을 통해 언제든지 정기결제를 해지할 수 있습니다.</li>
                <li>
                  구독을 해지하더라도 이미 결제가 완료된 당월 이용기간 동안은 프리미엄 서비스를 계속 이용할
                  수 있으며, 해당 이용기간이 종료되는 시점부터 자동으로 무료 플랜으로 전환되어 다음 결제가
                  청구되지 않습니다.
                </li>
                <li>구독 해지는 즉시 환불이나 즉시 서비스 중단을 의미하지 않습니다. 환불에 관한 사항은 별도의 환불정책을 따릅니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제8조 (이용자의 의무)</h2>
              <p>
                본 서비스는 아동을 대상으로 하는 콘텐츠를 생성하는 서비스이므로, 이용자는 다음 행위를 하여서는
                안 됩니다.
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>폭력적, 선정적, 차별적이거나 아동에게 부적절한 내용을 동화 생성 주제로 입력하는 행위</li>
                <li>타인의 개인정보를 무단으로 입력하거나 서비스를 부정한 목적으로 이용하는 행위</li>
                <li>서비스의 안정적 운영을 방해하는 행위(비정상적인 대량 요청, 시스템 해킹 시도 등)</li>
                <li>회사의 지식재산권, 타인의 저작권 등을 침해하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제9조 (회사의 의무 및 면책)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>회사는 안정적인 서비스 제공을 위해 노력합니다.</li>
                <li>
                  서비스가 생성하는 동화는 AI(인공지능) 모델을 통해 자동 생성되는 콘텐츠로, 내용의 완전성,
                  정확성을 보장하지 않으며 예상치 못한 표현이 포함될 수 있습니다. 만 3세 이상 아동이 이용할
                  경우 반드시 보호자가 동반하여 콘텐츠를 함께 확인할 것을 권장합니다.
                </li>
                <li>
                  회사는 천재지변, 불가항력, 이용자의 귀책사유로 인한 서비스 이용 장애에 대해서는 책임을 지지
                  않습니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제10조 (지식재산권)</h2>
              <p>
                서비스에서 제공하는 콘텐츠, 디자인, 로고, 소프트웨어 등에 대한 저작권 및 지식재산권은 회사에
                귀속됩니다. 이용자가 입력한 정보를 바탕으로 생성된 동화는 이용자가 개인적, 비상업적 용도로
                자유롭게 이용할 수 있으나, 회사는 서비스 개선 및 품질 향상 목적으로 관련 정보를 활용할 수
                있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제11조 (서비스 중단 및 계약 해지)
              </h2>
              <p>
                회사는 시스템 점검, 교체, 고장, 통신 두절 등 운영상 상당한 이유가 있는 경우 서비스 제공을
                일시적으로 중단할 수 있습니다. 이용자가 이 약관을 위반한 경우 회사는 사전 통지 후 이용계약을
                해지하거나 서비스 이용을 제한할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제12조 (분쟁 해결 및 준거법)
              </h2>
              <p>
                이 약관과 관련하여 발생한 분쟁에 대해서는 대한민국 법을 준거법으로 하며, 관련 법령에 정한
                관할법원에 소를 제기할 수 있습니다.
              </p>
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
