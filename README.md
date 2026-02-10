# Color Palette Generator (색상 팔레트 생성기)

조화로운 색상 팔레트를 자동으로 생성하는 웹 애플리케이션입니다.

## Features (기능)

- **다양한 색상 모드**
  - 보색 (Complementary)
  - 유사색 (Analogous)
  - 삼각배색 (Triadic)
  - 사각배색 (Tetradic)
  - 단색 변형 (Monochromatic)

- **색상 관리**
  - 5개 색상 슬롯 자동 생성
  - 스페이스바 또는 버튼으로 새 팔레트 생성
  - 각 색상 잠금/해금 기능 (잠긴 색상은 유지)
  - 원클릭 복사 (HEX, RGB, HSL)

- **색상 분석**
  - 대비 분석 (밝기 기반)
  - 색온 분석 (따뜻함/차가움)

- **내보내기 기능**
  - CSS 변수
  - Tailwind Config
  - JSON

- **히스토리**
  - 최근 10개 팔레트 저장
  - 클릭으로 팔레트 복구

- **다국어 지원**
  - 한국어, 영어, 중국어, 힌디어, 러시아어, 일본어, 스페인어, 포르투갈어, 인도네시아어, 터키어, 독일어, 프랑스어

- **PWA 지원**
  - 오프라인 작동
  - 설치 가능
  - 빠른 로딩

## Tech Stack

- HTML5
- CSS3 (Glassmorphism, Dark Mode First)
- Vanilla JavaScript (ES6+)
- Service Worker (PWA)
- LocalStorage (상태 저장)
- Google Analytics 4
- Google AdSense

## File Structure

```
color-palette/
├── index.html              # Main HTML
├── manifest.json           # PWA Manifest
├── sw.js                   # Service Worker
├── icon-192.svg            # App icon (192x192)
├── icon-512.svg            # App icon (512x512)
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   ├── i18n.js            # i18n module
│   ├── app.js             # Main app logic
│   └── locales/
│       ├── ko.json        # Korean
│       ├── en.json        # English
│       ├── zh.json        # Chinese
│       ├── hi.json        # Hindi
│       ├── ru.json        # Russian
│       ├── ja.json        # Japanese
│       ├── es.json        # Spanish
│       ├── pt.json        # Portuguese
│       ├── id.json        # Indonesian
│       ├── tr.json        # Turkish
│       ├── de.json        # German
│       └── fr.json        # French
└── README.md
```

## Usage

1. 사이트 방문: https://dopabrain.com/color-palette/
2. "새 팔레트 생성" 버튼 클릭 또는 스페이스바 누르기
3. 색상 모드 선택 (기본값: 보색)
4. 특정 색상 잠금 시 그 색상은 유지됨
5. 색상 코드 형식 선택 (HEX, RGB, HSL)
6. 각 색상을 클릭하여 복사
7. CSS 변수, Tailwind Config, JSON으로 내보내기
8. 팔레트 히스토리에서 이전 팔레트 복구

## Color Algorithm

### HSL (Hue, Saturation, Lightness) 기반 생성

1. **보색 (Complementary)**
   - Base: 랜덤 색상 생성
   - 보색 추가: Hue + 180도
   - 변형: 밝은 변형, 어두운 변형

2. **유사색 (Analogous)**
   - Base: 랜덤 색상 생성
   - 30도, -30도, 60도, -60도 회전

3. **삼각배색 (Triadic)**
   - Base: 랜덤 색상 생성
   - 120도, 240도 회전
   - 변형: 밝은 변형, 어두운 변형

4. **사각배색 (Tetradic)**
   - Base: 랜덤 색상 생성
   - 90도, 180도, 270도 회전
   - 보색 추가

5. **단색 변형 (Monochromatic)**
   - Base: 랜덤 색상 생성
   - 명도 30%, 60%, -30%, -60% 변형

## Color Code Conversion

- **HEX ↔ RGB ↔ HSL** 자동 변환
- HSL 기반 색상 생성으로 정확한 색상 관리

## State Management

- LocalStorage에 다음 정보 저장:
  - 현재 팔레트
  - 잠금 색상 정보
  - 색상 모드
  - 코드 형식
  - 팔레트 히스토리 (최근 10개)
  - 사용자 언어 설정

## Performance

- **초기 로딩**: < 2초 (PWA 캐시)
- **새 팔레트 생성**: < 100ms
- **색상 코드 복사**: 즉시
- **내보내기**: < 500ms

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Offline Support

- Service Worker를 통한 완전한 오프라인 지원
- 모든 기능이 인터넷 없이 작동
- 광고 제외 (인터넷 필요)

## Accessibility

- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 색상 대비 분석
- 접근성 포커스 인디케이터

## SEO

- Schema.org Structured Data
- Open Graph Meta Tags
- 다국어 hreflang 태그
- SEO 최적화 메타 설명

## License

MIT License - 무료로 사용, 수정, 배포 가능

## Author

DopaBrain (https://dopabrain.com/)

## Related Tools

- [Password Generator](https://dopabrain.com/password-generator/)
- [QR Code Generator](https://dopabrain.com/qr-generator/)
- [Unit Converter](https://dopabrain.com/unit-converter/)
- [BMI Calculator](https://dopabrain.com/bmi-calculator/)
