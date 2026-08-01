import { Question } from '../types';

export class DiagramEngine {
  /**
   * Lấy mã SVG sơ đồ / hình vẽ cho câu hỏi (nếu có hoặc tự động sinh theo nội dung)
   */
  static getQuestionDiagramSvg(question: Question): string | null {
    if (question.svgDiagram && question.svgDiagram.trim().length > 10) {
      return this.cleanSvgString(question.svgDiagram);
    }

    // Tự động nhận diện bài toán hình học / đồ thị để sinh hình vẽ bổ sung nếu thiếu
    return this.autoGenerateSvgIfNeeded(question.content + ' ' + (question.topic || ''));
  }

  /**
   * Lấy mã SVG sơ đồ / hình vẽ cho phần Lời giải / Đáp án
   */
  static getSolutionDiagramSvg(question: Question): string | null {
    if (question.solutionDiagramSvg && question.solutionDiagramSvg.trim().length > 10) {
      return this.cleanSvgString(question.solutionDiagramSvg);
    }

    if (question.svgDiagram && question.svgDiagram.trim().length > 10) {
      return this.cleanSvgString(question.svgDiagram);
    }

    const fullText = (question.content || '') + ' ' + (question.essayAnswerGuide || '') + ' ' + (question.explanation || '');
    return this.autoGenerateSvgIfNeeded(fullText);
  }

  /**
   * Chuẩn hóa chuỗi SVG
   */
  private static cleanSvgString(svg: string): string {
    let clean = svg.trim();
    if (clean.includes('```xml')) {
      clean = clean.replace(/```xml/g, '').replace(/```/g, '').trim();
    } else if (clean.includes('```svg')) {
      clean = clean.replace(/```svg/g, '').replace(/```/g, '').trim();
    } else if (clean.includes('```')) {
      clean = clean.replace(/```/g, '').trim();
    }
    if (!clean.includes('xmlns=')) {
      clean = clean.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return clean;
  }

  /**
   * Tự động sinh hình vẽ vector chuẩn mực cho Hình học & Đồ thị hàm số (chỉ khi bài toán thực sự yêu cầu/chứa hình)
   */
  private static autoGenerateSvgIfNeeded(text: string): string | null {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Chỉ tự động sinh hình nếu có từ khóa cho thấy bài toán cần hình vẽ / đồ thị minh họa
    const hasExplicitDiagramRequest = 
      lower.includes('cho đồ thị') ||
      lower.includes('như hình vẽ') ||
      lower.includes('xem hình') ||
      lower.includes('hình bên') ||
      lower.includes('cho hình chóp') ||
      lower.includes('cho hình lăng trụ') ||
      lower.includes('cho hình hộp') ||
      lower.includes('cho parabol (p)') ||
      lower.includes('cho parabol y') ||
      lower.includes('bảng biến thiên') ||
      lower.includes('vẽ đồ thị') ||
      lower.includes('đồ thị hàm số như hình');

    if (!hasExplicitDiagramRequest) {
      return null;
    }

    // 1. Đồ thị hàm số nhất biến (y = (ax+b)/(cx+d))
    if (lower.includes('hàm số nhất biến') || lower.includes('tiệm cận') || lower.includes('(ax+b)/(cx+d)') || lower.includes('phân thức')) {
      return this.generateRationalFunctionGraphSvg();
    }

    // 2. Đồ thị hàm bậc ba (y = ax^3 + bx^2 + cx + d)
    if (lower.includes('hàm số bậc ba') || lower.includes('bậc ba') || lower.includes('x^3') || lower.includes('cực trị')) {
      return this.generateCubicFunctionGraphSvg();
    }

    // 3. Đồ thị hàm bậc hai / Parabola (y = ax^2 + bx + c)
    if (lower.includes('parabol')) {
      return this.generateParabolaGraphSvg();
    }

    // 4. Hình chóp S.ABCD (có SA vuông góc đáy)
    if (lower.includes('s.abcd') || (lower.includes('hình chóp') && lower.includes('tứ giác'))) {
      return this.generatePyramidSabcdSvg();
    }

    // 5. Hình chóp S.ABC / Tứ diện
    if (lower.includes('s.abc') || lower.includes('tứ diện') || lower.includes('hình chóp tam giác')) {
      return this.generatePyramidSabcSvg();
    }

    // 6. Hình lăng trụ / Hình hộp
    if (lower.includes('lăng trụ') || lower.includes('hình hộp')) {
      return this.generatePrismSvg();
    }

    // 7. Tam giác / Đường cao / Trung tuyến
    if (lower.includes('cho tam giác') || lower.includes('đường cao') || lower.includes('trung tuyến')) {
      return this.generateTriangleSvg();
    }

    // 8. Đường tròn / Tiếp tuyến
    if (lower.includes('đường tròn') || lower.includes('tiếp tuyến') || lower.includes('tâm o')) {
      return this.generateCircleSvg();
    }

    // Nêu câu hỏi có từ khóa "vẽ đồ thị" hoặc "hình vẽ" chung
    if (lower.includes('vẽ đồ thị') || lower.includes('bảng biến thiên') || lower.includes('đồ thị')) {
      return this.generateGeneralGraphSvg();
    }

    return null;
  }

  /**
   * Đồ thị hàm nhất biến y = (2x+1)/(x-1)
   */
  private static generateRationalFunctionGraphSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="220" style="background:#ffffff; border-radius:12px;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
        </marker>
      </defs>
      <!-- Grid -->
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="1"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Coordinate Axes Ox, Oy -->
      <line x1="30" y1="180" x2="370" y2="180" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <line x1="160" y1="260" x2="160" y2="20" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="365" y="198" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">x</text>
      <text x="142" y="28" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">y</text>
      <text x="146" y="196" font-family="Times New Roman" font-size="13" font-style="italic" fill="#64748b">O</text>

      <!-- Asymptotes (Tiệm cận) -->
      <!-- Vertical asymptote x = 1 (x = 210) -->
      <line x1="220" y1="25" x2="220" y2="255" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,4" />
      <text x="225" y="42" font-family="Times New Roman" font-size="12" fill="#dc2626" font-weight="bold">x = 1</text>

      <!-- Horizontal asymptote y = 2 (y = 120) -->
      <line x1="35" y1="110" x2="365" y2="110" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,4" />
      <text x="40" y="103" font-family="Times New Roman" font-size="12" fill="#dc2626" font-weight="bold">y = 2</text>

      <!-- Hyperbola Branch 1 (left) -->
      <path d="M 40 165 C 100 160 180 155 205 250" fill="none" stroke="#2563eb" stroke-width="2.5" />

      <!-- Hyperbola Branch 2 (right) -->
      <path d="M 235 30 C 260 90 300 100 360 105" fill="none" stroke="#2563eb" stroke-width="2.5" />

      <!-- Key Points -->
      <circle cx="160" cy="180" r="3" fill="#0f172a" />
      <circle cx="220" cy="110" r="3.5" fill="#dc2626" />
      <text x="180" y="270" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#1e293b">Đồ thị hàm nhất biến y = (2x+1)/(x-1)</text>
    </svg>`;
  }

  /**
   * Đồ thị hàm bậc ba y = x^3 - 3x
   */
  private static generateCubicFunctionGraphSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="220" style="background:#ffffff; border-radius:12px;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
        </marker>
      </defs>
      <!-- Axes -->
      <line x1="30" y1="140" x2="370" y2="140" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <line x1="200" y1="260" x2="200" y2="20" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="365" y="158" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">x</text>
      <text x="182" y="28" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">y</text>
      <text x="186" y="156" font-family="Times New Roman" font-size="13" font-style="italic" fill="#64748b">O</text>

      <!-- Cubic Curve -->
      <path d="M 80 250 C 120 40 150 70 200 140 C 250 210 280 240 320 30" fill="none" stroke="#059669" stroke-width="2.5" />

      <!-- Extrema Points -->
      <!-- Local Max (-1, 2) -->
      <line x1="140" y1="140" x2="140" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="200" y1="80" x2="140" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
      <circle cx="140" cy="80" r="4" fill="#059669" />
      <text x="125" y="70" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#047857">Cực đại (-1, 2)</text>

      <!-- Local Min (1, -2) -->
      <line x1="260" y1="140" x2="260" y2="200" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="200" y1="200" x2="260" y2="200" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
      <circle cx="260" cy="200" r="4" fill="#059669" />
      <text x="265" y="215" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#047857">Cực tiểu (1, -2)</text>

      <text x="180" y="270" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#1e293b">Đồ thị hàm số bậc ba y = x³ - 3x</text>
    </svg>`;
  }

  /**
   * Đồ thị Parabola y = ax^2 + bx + c
   */
  private static generateParabolaGraphSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="220" style="background:#ffffff; border-radius:12px;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
        </marker>
      </defs>
      <!-- Axes -->
      <line x1="30" y1="200" x2="370" y2="200" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <line x1="180" y1="260" x2="180" y2="20" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="365" y="218" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">x</text>
      <text x="162" y="28" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">y</text>
      <text x="166" y="216" font-family="Times New Roman" font-size="13" font-style="italic" fill="#64748b">O</text>

      <!-- Parabola Curve -->
      <path d="M 60 40 Q 230 310 340 40" fill="none" stroke="#d97706" stroke-width="2.5" />

      <!-- Vertex I(2, -1) -->
      <line x1="230" y1="200" x2="230" y2="225" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="180" y1="225" x2="230" y2="225" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
      <circle cx="230" cy="225" r="4" fill="#b45309" />
      <text x="238" y="240" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#b45309">Đỉnh I(x₀, y₀)</text>

      <text x="160" y="270" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#1e293b">Đồ thị Parabol y = ax² + bx + c</text>
    </svg>`;
  }

  /**
   * Hình chóp S.ABCD (SA vuông góc đáy)
   */
  private static generatePyramidSabcdSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="240" style="background:#ffffff; border-radius:12px;">
      <!-- Base ABCD -->
      <!-- A(100, 210), B(280, 210), C(340, 260), D(160, 260) -->
      <!-- S(100, 40) -->

      <!-- Hidden edges (Dashed) -->
      <line x1="100" y1="210" x2="280" y2="210" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" />
      <line x1="100" y1="210" x2="160" y2="260" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" />
      <line x1="100" y1="40" x2="100" y2="210" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,4" />

      <!-- Visible Edges -->
      <line x1="160" y1="260" x2="340" y2="260" stroke="#334155" stroke-width="2" />
      <line x1="340" y1="260" x2="280" y2="210" stroke="#334155" stroke-width="2" />
      <line x1="100" y1="40" x2="160" y2="260" stroke="#334155" stroke-width="2" />
      <line x1="100" y1="40" x2="340" y2="260" stroke="#334155" stroke-width="2" />
      <line x1="100" y1="40" x2="280" y2="210" stroke="#334155" stroke-width="2" />

      <!-- Right angle marker SA | (ABCD) -->
      <path d="M 100 198 L 112 198 L 112 210" fill="none" stroke="#0284c7" stroke-width="1.2" />

      <!-- Vertices Labels -->
      <circle cx="100" cy="40" r="3.5" fill="#0284c7" />
      <circle cx="100" cy="210" r="3.5" fill="#334155" />
      <circle cx="280" cy="210" r="3.5" fill="#334155" />
      <circle cx="340" cy="260" r="3.5" fill="#334155" />
      <circle cx="160" cy="260" r="3.5" fill="#334155" />

      <text x="95" y="30" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#0369a1">S</text>
      <text x="80" y="215" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">A</text>
      <text x="290" y="210" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">B</text>
      <text x="350" y="270" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">C</text>
      <text x="145" y="275" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">D</text>

      <text x="130" y="292" font-family="Times New Roman" font-size="13" font-weight="bold" fill="#0369a1">Hình chóp S.ABCD (SA ⊥ (ABCD))</text>
    </svg>`;
  }

  /**
   * Hình chóp tam giác S.ABC
   */
  private static generatePyramidSabcSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 280" width="100%" height="220" style="background:#ffffff; border-radius:12px;">
      <!-- S(190, 35), A(80, 220), B(300, 220), C(200, 260) -->
      <!-- Hidden AC line -->
      <line x1="80" y1="220" x2="300" y2="220" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" />

      <!-- Altitude SH -->
      <line x1="190" y1="35" x2="190" y2="233" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,4" />
      <circle cx="190" cy="233" r="3" fill="#dc2626" />
      <text x="195" y="248" font-family="Times New Roman" font-size="13" font-weight="bold" fill="#dc2626">H</text>

      <!-- Visible Edges -->
      <line x1="80" y1="220" x2="200" y2="260" stroke="#334155" stroke-width="2" />
      <line x1="200" y1="260" x2="300" y2="220" stroke="#334155" stroke-width="2" />
      <line x1="190" y1="35" x2="80" y2="220" stroke="#334155" stroke-width="2" />
      <line x1="190" y1="35" x2="200" y2="260" stroke="#334155" stroke-width="2" />
      <line x1="190" y1="35" x2="300" y2="220" stroke="#334155" stroke-width="2" />

      <!-- Labels -->
      <text x="185" y="25" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#0f172a">S</text>
      <text x="60" y="225" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">A</text>
      <text x="310" y="225" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">B</text>
      <text x="200" y="278" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">C</text>

      <text x="135" y="275" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#334155">Hình chóp S.ABC (SH ⊥ (ABC))</text>
    </svg>`;
  }

  /**
   * Hình lăng trụ tam giác ABC.A'B'C'
   */
  private static generatePrismSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 290" width="100%" height="230" style="background:#ffffff; border-radius:12px;">
      <!-- Top A'(100, 40), B'(280, 40), C'(190, 80) -->
      <!-- Bottom A(100, 200), B(280, 200), C(190, 240) -->

      <!-- Hidden edge AC -->
      <line x1="100" y1="200" x2="280" y2="200" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" />

      <!-- Top Triangle -->
      <polygon points="100,40 280,40 190,80" fill="none" stroke="#2563eb" stroke-width="2" />

      <!-- Bottom Triangle -->
      <line x1="100" y1="200" x2="190" y2="240" stroke="#2563eb" stroke-width="2" />
      <line x1="190" y1="240" x2="280" y2="200" stroke="#2563eb" stroke-width="2" />

      <!-- Vertical Edges -->
      <line x1="100" y1="40" x2="100" y2="200" stroke="#334155" stroke-width="2" />
      <line x1="280" y1="40" x2="280" y2="200" stroke="#334155" stroke-width="2" />
      <line x1="190" y1="80" x2="190" y2="240" stroke="#334155" stroke-width="2" />

      <!-- Labels -->
      <text x="80" y="40" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1d4ed8">A'</text>
      <text x="290" y="40" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1d4ed8">B'</text>
      <text x="195" y="75" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1d4ed8">C'</text>
      <text x="80" y="205" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">A</text>
      <text x="290" y="205" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">B</text>
      <text x="195" y="258" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">C</text>

      <text x="110" y="280" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#1e293b">Hình lăng trụ tam giác ABC.A'B'C'</text>
    </svg>`;
  }

  /**
   * Tam giác ABC với đường cao AH
   */
  private static generateTriangleSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="100%" height="200" style="background:#ffffff; border-radius:12px;">
      <!-- A(180, 30), B(50, 200), C(310, 200), H(180, 200) -->
      <polygon points="180,30 50,200 310,200" fill="none" stroke="#2563eb" stroke-width="2.2" />

      <!-- Altitude AH -->
      <line x1="180" y1="30" x2="180" y2="200" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,3" />

      <!-- Right Angle Marker at H -->
      <path d="M 180 188 L 192 188 L 192 200" fill="none" stroke="#dc2626" stroke-width="1.2" />

      <!-- Vertices -->
      <circle cx="180" cy="30" r="3.5" fill="#2563eb" />
      <circle cx="50" cy="200" r="3.5" fill="#2563eb" />
      <circle cx="310" cy="200" r="3.5" fill="#2563eb" />
      <circle cx="180" cy="200" r="3.5" fill="#dc2626" />

      <text x="175" y="20" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#1e293b">A</text>
      <text x="30" y="210" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#1e293b">B</text>
      <text x="320" y="210" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#1e293b">C</text>
      <text x="175" y="220" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#dc2626">H</text>

      <text x="100" y="242" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#334155">Tam giác ABC với đường cao AH ⊥ BC</text>
    </svg>`;
  }

  /**
   * Đường tròn tâm O với bán kính R & tiếp tuyến
   */
  private static generateCircleSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250" width="100%" height="200" style="background:#ffffff; border-radius:12px;">
      <!-- Circle O(180, 120), R=80 -->
      <circle cx="180" cy="120" r="80" fill="none" stroke="#0284c7" stroke-width="2.2" />

      <!-- Center O -->
      <circle cx="180" cy="120" r="3.5" fill="#0284c7" />
      <text x="185" y="115" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#0284c7">O</text>

      <!-- Radius OA -->
      <line x1="180" y1="120" x2="260" y2="120" stroke="#0284c7" stroke-width="1.8" />
      <text x="215" y="112" font-family="Times New Roman" font-size="13" font-style="italic" fill="#0369a1">R</text>

      <!-- Tangent at B(180, 200) -->
      <line x1="80" y1="200" x2="280" y2="200" stroke="#e11d48" stroke-width="2" />
      <line x1="180" y1="120" x2="180" y2="200" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4,3" />

      <!-- Right Angle Marker -->
      <path d="M 180 188 L 192 188 L 192 200" fill="none" stroke="#e11d48" stroke-width="1.2" />

      <circle cx="260" cy="120" r="3.5" fill="#0284c7" />
      <circle cx="180" cy="200" r="3.5" fill="#e11d48" />

      <text x="268" y="125" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#1e293b">A</text>
      <text x="175" y="218" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#e11d48">B</text>

      <text x="90" y="242" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#334155">Đường tròn (O; R) và tiếp tuyến tại B</text>
    </svg>`;
  }

  /**
   * Đồ thị hàm số tổng quát
   */
  private static generateGeneralGraphSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 250" width="100%" height="200" style="background:#ffffff; border-radius:12px;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
        </marker>
      </defs>
      <line x1="30" y1="150" x2="350" y2="150" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <line x1="180" y1="230" x2="180" y2="20" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="345" y="168" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">x</text>
      <text x="162" y="28" font-family="Times New Roman" font-size="14" font-weight="bold" fill="#1e293b">y</text>
      <text x="166" y="166" font-family="Times New Roman" font-size="13" font-style="italic" fill="#64748b">O</text>

      <path d="M 60 210 Q 120 30 180 150 T 320 40" fill="none" stroke="#2563eb" stroke-width="2.5" />
      <text x="110" y="240" font-family="Times New Roman" font-size="12" font-weight="bold" fill="#1e293b">Đồ thị minh họa hàm số y = f(x)</text>
    </svg>`;
  }
}
