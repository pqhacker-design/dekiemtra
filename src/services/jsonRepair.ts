/**
 * Bộ công cụ chẩn đoán & tự động sửa chữa chuỗi JSON trả về từ AI Gemini
 * Giải quyết các lỗi phổ biến:
 * 1. Markdown code fences (```json ... ```)
 * 2. Lỗi công thức toán LaTeX chứa dấu backslash unescaped (\frac, \sqrt, \alpha, \vec, \begin...) gây lỗi Bad escaped character in JSON
 * 3. Dấu phẩy thừa (trailing commas)
 * 4. Ký tự xuống dòng / tab chưa escape trong chuỗi string literal
 */
export function repairJsonString(rawText: string): string {
  if (!rawText) return '';

  let str = rawText.trim();

  // 1. Loại bỏ Markdown code block wrappers ```json ... ``` hoặc ``` ... ```
  str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // 2. Tìm vị trí khối JSON chính (chứa dấu { hoặc [ đầu tiên đến } hoặc ] cuối cùng)
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  const lastBrace = str.lastIndexOf('}');
  const lastBracket = str.lastIndexOf(']');
  let endIdx = -1;
  if (lastBrace !== -1 && lastBracket !== -1) {
    endIdx = Math.max(lastBrace, lastBracket);
  } else if (lastBrace !== -1) {
    endIdx = lastBrace;
  } else if (lastBracket !== -1) {
    endIdx = lastBracket;
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    str = str.substring(startIdx, endIdx + 1);
  }

  // Kiếm tra nếu đã parse ngon lành luôn
  try {
    JSON.parse(str);
    return str;
  } catch {
    // Tiến hành sửa chữa tiếp
  }

  // 3. Sửa các từ LaTeX phổ biến khi AI lỡ dùng \ + chữ cái bắt đầu bằng \b, \f, \n, \r, \t
  const latexKeywords = [
    'frac', 'forall', 'flat', 'frown',
    'begin', 'bar', 'box', 'beta', 'bullet', 'bold', 'bbox', 'binom',
    'nabla', 'nu', 'neg', 'natural', 'neq', 'new',
    'right', 'rho', 'real', 'rightarrow', 'rangle', 'rad',
    'text', 'theta', 'tan', 'times', 'tau', 'tilde', 'to', 'triangle'
  ];

  for (const kw of latexKeywords) {
    const re = new RegExp('\\\\(' + kw + ')\\b', 'g');
    str = str.replace(re, '\\\\$1');
  }

  // 4. Sửa tất cả các dấu `\` theo sau là ký tự KHÔNG PHẢI trong bộ escape JSON chuẩn [ " / \ b f n r t u ]
  str = str.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');

  // 5. Sửa lỗi trailing commas trước } hoặc ]
  str = str.replace(/,\s*([}\]])/g, '$1');

  // Thử parse sau bước 5
  try {
    JSON.parse(str);
    return str;
  } catch {
    // Tiếp tục sửa ký tự điều khiển trong string
  }

  // 6. Xử lý ký tự điều khiển xuống dòng / tab trong string literals
  let inString = false;
  let escaped = false;
  let buf = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      inString = !inString;
      buf += char;
    } else if (inString) {
      if (char === '\n') {
        buf += '\\n';
      } else if (char === '\r') {
        buf += '\\r';
      } else if (char === '\t') {
        buf += '\\t';
      } else {
        buf += char;
      }
    } else {
      buf += char;
    }

    if (char === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  str = buf;

  // 7. Thử parse lần cuối, nếu không được thì trả về chuỗi đã sửa tối đa
  return str;
}

/**
 * An toàn parse JSON với tự động sửa chữa
 */
export function safeJsonParse<T = any>(rawText: string): T {
  if (!rawText) throw new Error('Dữ liệu JSON rỗng');
  
  const repaired = repairJsonString(rawText);
  try {
    return JSON.parse(repaired);
  } catch (err: any) {
    // Lần thử cuối cùng: Thay thế tất cả single backslash đứng tự do thành double backslash
    try {
      const aggressiveFix = repaired.replace(/\\/g, '\\\\').replace(/\\\\\\\\/g, '\\\\');
      return JSON.parse(aggressiveFix);
    } catch {
      throw new Error(`Dữ liệu AI trả về không phải định dạng JSON hợp lệ: ${err.message}`);
    }
  }
}
