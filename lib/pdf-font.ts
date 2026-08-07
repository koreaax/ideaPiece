const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function withBasePath(urlPath: string) {
  if (!basePath) return urlPath;
  return `${basePath}${urlPath}`;
}

let cachedFontBase64: string | null = null;

/**
 * ArrayBuffer를 base64 문자열로 변환한다.
 * 큰 파일(예: 10MB 폰트)을 String.fromCharCode(...bytes) 스프레드 방식으로 처리하면
 * 호출 스택 오버플로우가 발생할 수 있어, 청크 단위로 나눠서 처리한다.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * 한글 지원 TTF 폰트(Noto Sans KR)를 fetch해서 base64 문자열로 반환한다.
 * jsPDF의 addFileToVFS/addFont에 바로 사용할 수 있는 형태다.
 * 한 번 로드된 폰트는 모듈 스코프 캐시에 저장되어 재사용된다.
 */
export async function loadKoreanFontBase64(): Promise<string> {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  const fontUrl = withBasePath('/fonts/NotoSansKR-Regular.ttf');

  let response: Response;
  try {
    response = await fetch(fontUrl);
  } catch {
    throw new Error('한글 폰트 파일을 불러오는 중 네트워크 오류가 발생했습니다.');
  }

  if (!response.ok) {
    throw new Error(`한글 폰트 파일을 불러오지 못했습니다. (상태 코드: ${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  cachedFontBase64 = base64;
  return cachedFontBase64;
}
