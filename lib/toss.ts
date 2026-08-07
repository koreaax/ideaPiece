/**
 * 토스페이먼츠 API 연동 유틸 (서버 전용)
 */

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';

function getAuthHeader() {
  const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
}

export type IssueBillingKeyResponse = {
  billingKey: string;
  customerKey: string;
  card?: {
    company: string;
    number: string;
  };
  authenticatedAt: string;
};

export type ExecuteBillingResponse = {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  approvedAt: string;
};

/**
 * 1. 인증키(authKey)로 빌링키 발급받기
 */
export async function issueBillingKey(authKey: string, customerKey: string): Promise<IssueBillingKeyResponse> {
  const response = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authKey,
      customerKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`토스 빌링키 발급 실패 (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * 2. 발급된 빌링키로 실제 결제 승인 요청하기
 */
export async function executeBilling({
  billingKey,
  customerKey,
  amount,
  orderId,
  orderName,
}: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}): Promise<ExecuteBillingResponse> {
  const response = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
      customerEmail: undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`토스 자동결제 승인 실패 (${response.status}): ${errorText}`);
  }

  return response.json();
}
