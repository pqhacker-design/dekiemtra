/**
 * Làm sạch chuỗi LaTeX thành văn bản thuần cho Excel / Plain Text Export
 */
export function cleanLatexForDocx(latex: string): string {
  if (!latex) return '';
  let str = latex;
  str = str.replace(/\\%/g, '%');
  str = str.replace(/\\begin\{cases\}/g, '{ ');
  str = str.replace(/\\end\{cases\}/g, ' }');
  str = str.replace(/\\\\|\\cr/g, '; ');
  str = str.replace(/&/g, ' ');
  str = str.replace(/\\\s+/g, ' ');
  str = str.replace(/\\\(|\\\)/g, '');
  str = str.replace(/\\(frac|dfrac)\{([^{}]+)\}\{([^{}]+)\}/g, '$2/$3');
  str = str.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  str = str.replace(/\$(.*?)\$/g, '$1');
  str = str.replace(/\\(text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, '$2');
  str = str.replace(/\\(widehat|hat)\{([^{}]+)\}/g, '$2');
  str = str.replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\mathbb\{N\}/g, 'ℕ').replace(/\\mathbb\{Z\}/g, 'ℤ').replace(/\\mathbb\{Q\}/g, 'ℚ').replace(/\\mathbb\{C\}/g, 'ℂ');
  str = str.replace(/\\mathbb\{([A-Za-z])\}/g, '$1');
  str = str.replace(/\\setminus\b/g, '\\');
  str = str.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
  str = str.replace(/\\left\s*/g, '').replace(/\\right\s*/g, '');
  str = str.replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ').replace(/\\Delta/g, 'Δ').replace(/\\pi/g, 'π');

  return str;
}

export function fixCasesLatex(rawText: string): string {
  if (!rawText) return rawText;
  let str = rawText;

  // 1. Chuyển các ký hiệu hệ phương trình gõ dạng \{ ... \} có chứa dấu bằng/bất đẳng thức thành \begin{cases} ... \end{cases}
  str = str.replace(/\\\{\s*([a-zA-Z0-9_\-\+\s\=\<\>\,\;\:\\\(\)\/\cdot\Delta]+?)\s*\\\}/g, (m, inner) => {
    if (inner.includes('=') || inner.includes('\\le') || inner.includes('\\ge')) {
      return `\\begin{cases} ${inner} \\end{cases}`;
    }
    return m;
  });

  // 2. Xử lý chuẩn hóa môi trường \begin{cases} ... \end{cases}
  str = str.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (match, inner) => {
    let cleanedInner = inner.trim();

    // Sửa trường hợp AI xuất "x + y = 4 \ x - y = 2" (dấu \ lẻ theo sau bởi space) -> "\\ "
    cleanedInner = cleanedInner.replace(/\\\s+(?=[0-9a-zA-Z\-\+\(\)\{])/g, ' \\\\ ');

    // Nếu đã có double backslash \\ thì giữ nguyên
    if (cleanedInner.includes('\\\\')) {
      return `\\begin{cases} ${cleanedInner} \\end{cases}`;
    }

    // Nếu dùng chấm phẩy hoặc dấu phẩy giữa các phương trình (VD: "x + y = 4; x - y = 2")
    if (/;|,/.test(cleanedInner)) {
      cleanedInner = cleanedInner.replace(/([0-9a-zA-Z\)\}\s]+)[;,]\s*([0-9a-zA-Z\-\+]+)/g, '$1 \\\\ $2');
    }

    // Nếu vẫn chưa có \\, phân tách các phương trình đứng liền kề nhau trên cùng 1 hàng
    if (!cleanedInner.includes('\\\\')) {
      cleanedInner = cleanedInner.replace(
        /(=|>|<|\\le|\\ge|\\neq)\s*([\-\+]?\s*[a-zA-Z0-9\(\)\{\}\^\.\/]+(?:\s*[\+\-\*\/]\s*[a-zA-Z0-9\(\)\{\}\^\.\/]+)*)\s+((?:[\-\+]?\s*)?[0-9a-zA-Z\(\)\{\}\\\|\vec]+(?:\s*[\+\-\*\/]\s*[0-9a-zA-Z]+)*\s*(?:=|\\le|\\ge|<|>|\\neq))/g,
        '$1 $2 \\\\ $3'
      );
    }

    return `\\begin{cases} ${cleanedInner} \\end{cases}`;
  });

  return str;
}

export function processPlainPart(plain: string): string {
  if (!plain) return plain;
  let str = plain;

  // 1. Dọn dẹp dấu $ bị lẻ/mồ côi dán trực tiếp vào lệnh LaTeX
  str = str.replace(/(\\[a-zA-Z]+(\{[^{}]*\})*)\$/g, '$1');

  // 2. Loại bỏ dấu $ lẻ đơn độc không có cặp trong phần plain text
  const dollarMatches = str.match(/\$/g);
  if (dollarMatches && dollarMatches.length % 2 !== 0) {
    str = str.replace(/([^$]*)\$([^$]*)$/, '$1$2');
  }

  // 3. Chuẩn hóa phép nhân dấu chấm chỉ áp dụng cho 2 chữ số / biến ngắn thuần toán
  str = str.replace(/(\b[0-9a-z])\s*\.\s*([0-9a-z]\b)/gi, (m, p1, p2) => {
    if (/^\d+$/.test(p1) && /^\d+$/.test(p2)) {
      return m; // Giữ nguyên số thập phân chuẩn như 3.14
    }
    if (/[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/.test(p2)) {
      return `${p1}. ${p2}`;
    }
    return `${p1} \\cdot ${p2}`;
  });

  // Dọn dẹp \cdot dính liền vào từ Tiếng Việt
  str = str.replace(/\\cdot\s*([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ])/g, '. $1');

  // 4. Tự động bọc $$...$$ cho các môi trường LaTeX nhiều dòng
  str = str.replace(
    /(\\begin\{(cases|aligned|array|matrix|pmatrix|bmatrix)\}[\s\S]*?\\end\{\2\})/g,
    ' $$$1$$ '
  );

  // 5. Gom và bọc NGUYÊN CẢ KHỐI CÔNG THỨC liên tục chứa lệnh LaTeX hoặc lũy thừa/chỉ số
  const latexCommandRegex = /\\(d?frac|sqrt|mathbb|vec|widehat|tilde|overline|bar|vdots|cdots|ldots|dots|ddots|mid|nmid|Delta|alpha|beta|gamma|delta|epsilon|theta|lambda|pi|sigma|phi|omega|Omega|angle|triangle|sim|perp|parallel|cong|equiv|le|geq|leq|ge|neq|approx|degree|cdot|times|pm|div|Leftrightarrow|Rightarrow|rightarrow|to|forall|exists|in|notin|subset|subseteq|supset|supseteq|cap|cup|emptyset|setminus)\b|[\^]|\\\{/g;

  if (latexCommandRegex.test(str)) {
    const isVietnameseWord = (word: string) => {
      if (!word) return false;
      if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(word)) return true;
      const commonVnWords = ['cho', 'tinh', 'tim', 'viet', 'thuc', 'hien', 'phep', 'tinh', 'bieu', 'thuc', 'tap', 'hop', 'gia', 'tri', 'sao', 'cho', 'voi', 'khi', 'do', 'bang', 'cach', 'liet', 'ke', 'phan', 'tu', 'chung', 'minh', 'rang', 'so', 'tu', 'nhien', 'hoc', 'sinh', 'cau', 'diem', 'dap', 'an'];
      return commonVnWords.includes(word.toLowerCase());
    };

    str = str.replace(/((?:[a-zA-Z0-9_A-Z\+\-\*\/\=\<\>\(\)\[\]\{\}\s\:\,\|\.]*?\\(?:d?frac|sqrt|mathbb|vec|widehat|tilde|overline|bar|vdots|cdots|ldots|dots|ddots|mid|nmid|Delta|alpha|beta|gamma|delta|epsilon|theta|lambda|pi|sigma|phi|omega|Omega|angle|triangle|sim|perp|parallel|cong|equiv|le|geq|leq|ge|neq|approx|degree|cdot|times|pm|div|Leftrightarrow|Rightarrow|rightarrow|to|forall|exists|in|notin|subset|subseteq|supset|supseteq|cap|cup|emptyset|setminus)\b[a-zA-Z0-9_A-Z\+\-\*\/\=\<\>\(\)\[\]\{\}\s\:\,\|\.\\\^]*)+)/g, (match) => {
      let trimmed = match.trim();
      let trailingPunct = '';
      if (/[.,;:\?!]$/.test(trimmed)) {
        trailingPunct = trimmed.slice(-1);
        trimmed = trimmed.slice(0, -1).trim();
      }
      if (!trimmed || trimmed.startsWith('$')) return match;

      const words = trimmed.split(/\s+/);
      const hasVnWord = words.some(isVietnameseWord);
      if (hasVnWord) {
        return match.replace(/(\\{1,2}[a-zA-Z]+\{[^{}]*\}|\\{1,2}[a-zA-Z]+\b|[0-9A-Za-z_]+\^[0-9A-Za-z_\{\}\+\-]+)/g, ' $$$1$$ ');
      }

      return ` $${trimmed}$ ${trailingPunct}`;
    });

    // 6. Bọc cho các lũy thừa độc lập chưa bọc
    str = str.replace(/([^$\w]|^)([A-Za-z0-9_\(\)]+\s*[\=\+\-\*\/]?\s*[A-Za-z0-9_]+\^[0-9A-Za-z_\{\}\+\-]+(\s*[\+\-\*\/\=\s]*[0-9A-Za-z_\^\+\-\*/\{\}]+)*)([^$\w]|$)/g, (m, p1, p2, p3) => {
      if (p2.includes('$')) return m;
      return `${p1} $${p2.trim()}$ ${p3}`;
    });
  }

  return str;
}

export function autoWrapUnwrappedLatex(text: string): string {
  if (!text) return text;

  let cleanedText = fixCasesLatex(text);
  cleanedText = cleanedText.replace(/(\\[a-zA-Z]+(\{[^{}]*\})*)\$/g, '$1');

  const mathBlockRegex = /(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\([^\)]*\\\))/gs;
  const parts: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(cleanedText)) !== null) {
    if (match.index > lastIdx) {
      parts.push(processPlainPart(cleanedText.substring(lastIdx, match.index)));
    }
    parts.push(fixCasesLatex(match[0]));
    lastIdx = mathBlockRegex.lastIndex;
  }
  if (lastIdx < cleanedText.length) {
    parts.push(processPlainPart(cleanedText.substring(lastIdx)));
  }

  let result = parts.join('');

  result = result.replace(/\$\s*\$/g, '');
  result = result.replace(/\$\s+\$/g, ' ');

  return result;
}
