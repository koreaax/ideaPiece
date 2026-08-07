import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          <h1 className="mb-1 text-2xl font-black text-slate-800 sm:text-3xl">개인정보처리방침</h1>
          <p className="mb-8 text-sm text-slate-500">
            [상호명을 입력하세요](이하 &ldquo;회사&rdquo;)는 이용자의 개인정보를 중요시하며, 「개인정보
            보호법」 등 관련 법령을 준수하기 위해 노력합니다. 본 방침은 회사가 제공하는 Fairytale
            IdeaPiece 서비스에 적용됩니다.
          </p>

          <div className="space-y-7 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제1조 (수집하는 개인정보 항목)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>회원가입 시: 이메일 주소, 비밀번호(암호화되어 저장됨)</li>
                <li>Google 소셜 로그인 이용 시: Google 계정에서 제공하는 이메일 등 기본 프로필 정보</li>
                <li>
                  유료 결제 시: 결제에 필요한 카드 정보는 결제대행사인 토스페이먼츠(Toss Payments)가
                  직접 수집·처리하며, 카드번호 등 민감한 결제정보는 회사의 서버에 저장되지 않습니다. 회사는
                  결제 상태 및 구독 정보(플랜, 구독 상태, 구독 만료일 등)만을 보유합니다.
                </li>
                <li>
                  <strong>아이의 이름, 생성된 동화 내용, 완독 기록, 획득한 배지 등은 이용자의 브라우저
                  localStorage에만 저장되며, 회사의 서버로 전송되거나 회사가 별도로 수집하지 않습니다.</strong>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제2조 (개인정보 수집 방법)
              </h2>
              <p>
                회사는 회원가입, 로그인(이메일/Google), 유료 서비스 결제 등 서비스 이용 과정에서 이용자가
                직접 입력하거나 제공하는 정보를 통해 개인정보를 수집합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제3조 (개인정보의 수집 및 이용 목적)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>회원 식별 및 로그인 인증</li>
                <li>유료 서비스(프리미엄 멤버십) 결제 및 정기결제 관리</li>
                <li>서비스 이용 관련 공지, 문의 응대</li>
                <li>서비스 부정 이용 방지 및 안정적인 운영</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제4조 (개인정보의 보유 및 이용 기간)
              </h2>
              <p>
                회사는 회원 탈퇴 시 지체 없이 이용자의 개인정보를 파기합니다. 다만 관계 법령에 따라 보존할
                필요가 있는 경우, 회사는 관계 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다(예:
                「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 대금결제 및 재화 등의 공급에 관한 기록
                5년, 소비자의 불만 또는 분쟁처리에 관한 기록 3년 등).
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제5조 (개인정보의 제3자 제공)
              </h2>
              <p>
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 결제 처리를 위해
                결제대행사인 토스페이먼츠에 결제에 필요한 최소한의 정보를 제공하는 경우는 예외로 합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제6조 (개인정보처리 위탁)
              </h2>
              <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Supabase: 회원 데이터베이스 관리 및 인증(로그인) 처리</li>
                <li>토스페이먼츠(Toss Payments): 정기결제 및 빌링키 기반 결제 처리</li>
                <li>
                  OpenAI / Google(Gemini): 동화 생성을 위해 이용자가 입력한 아이 이름, 선택한 주제 등의
                  텍스트가 AI 동화 생성 목적으로 해당 사업자의 API로 전송되어 처리됩니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제7조 (이용자의 권리와 행사 방법)
              </h2>
              <p>
                이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있으며,
                아래 고객센터를 통해 요청할 수 있습니다. 요청 시 회사는 지체 없이 필요한 조치를 취합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제8조 (개인정보의 안전성 확보 조치)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>비밀번호는 암호화하여 저장하며, 복호화가 불가능한 방식으로 관리됩니다.</li>
                <li>결제 관련 민감정보는 회사 서버가 아닌 결제대행사(토스페이먼츠)를 통해 안전하게 처리됩니다.</li>
                <li>개인정보에 대한 접근 권한을 최소한의 인원으로 제한하여 관리합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제9조 (아동의 개인정보 보호)
              </h2>
              <p>
                본 서비스는 만 3세 아동을 위한 맞춤형 동화 콘텐츠를 제공하지만, 회원가입 및 결제 등 계정
                관련 절차는 반드시 보호자(성인)가 진행합니다. 회사는 아동의 개인정보를 직접 수집하지
                않으며, 아이의 이름 등 동화 생성에 사용되는 정보는 회사 서버로 전송·저장되지 않고 이용자의
                브라우저 localStorage에만 저장됩니다.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">
                제10조 (개인정보 보호책임자)
              </h2>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>성명: [개인정보 보호책임자 성명을 입력하세요]</li>
                <li>직책: [직책을 입력하세요]</li>
                <li>이메일: [개인정보 보호책임자 이메일을 입력하세요]</li>
                <li>연락처: [연락처를 입력하세요]</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-black text-slate-800">제11조 (고지의 의무)</h2>
              <p>
                현 개인정보처리방침의 내용이 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일 전부터 서비스
                내 공지사항을 통해 고지할 것입니다.
              </p>
            </section>

            <section className="border-t border-slate-200 pt-6">
              <h2 className="mb-2 text-lg font-black text-slate-800">사업자 정보</h2>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>상호명: [상호명을 입력하세요]</li>
                <li>대표자: [대표자명을 입력하세요]</li>
                <li>사업자등록번호: [사업자등록번호를 입력하세요]</li>
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
