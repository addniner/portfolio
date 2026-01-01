# 화면 기획서: CLI Portfolio (Dual Panel)

## 1. 전체 레이아웃

**컨셉**: 좌측 터미널 + 우측 뷰어의 듀얼 패널 구조. 모든 UI 인터랙션은 터미널 명령어로 변환되어 실행됨.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐   │
│  │  ● ○ ○  Terminal            ─ □ × │  │  📁 Project A              ↗ GitHub│   │
│  ├───────────────────────────────────┤  ├───────────────────────────────────┤   │
│  │                                   │  │                                   │   │
│  │  $ ls                             │  │  # Project A                      │   │
│  │  project-a  project-b  project-c  │  │                                   │   │
│  │                                   │  │  A modern web application         │   │
│  │  $ cat project-a                  │  │  built with React and TypeScript. │   │
│  │                                   │  │                                   │   │
│  │                                   │  │  ## Features                      │   │
│  │                                   │  │  - Feature 1                      │   │
│  │                                   │  │  - Feature 2                      │   │
│  │                                   │  │                                   │   │
│  │                                   │  │  ★ 128  |  🍴 23  |  TypeScript   │   │
│  │  $ █                              │  │                                   │   │
│  │                                   │  │                                   │   │
│  └───────────────────────────────────┘  └───────────────────────────────────┘   │
│                                                                                  │
│         ↑ 터미널 (입력/히스토리)                  ↑ 뷰어 (결과 렌더링)            │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**핵심 원칙**: 뷰어에서의 모든 클릭은 터미널 명령어로 변환되어 실행됨

---

## 2. 듀얼 패널 동기화

### 2.1 동기화 원칙

모든 UI 인터랙션은 터미널 명령어를 통해 동작함.

| 뷰어 액션 | 터미널 명령어 | 결과 |
|----------|--------------|------|
| 프로젝트 클릭 | `cat <name>` | 뷰어에 README 렌더링 |
| GitHub 버튼 클릭 | `open <name>` | 새 탭에서 GitHub 열기 |
| About Me 클릭 | `whoami` | 뷰어에 프로필 표시 |
| Projects 클릭 | `ls -l` | 뷰어에 프로젝트 목록 표시 |
| 뒤로가기 클릭 | `cd ..` | 이전 상태로 복귀 |

### 2.2 동작 흐름

```
[뷰어에서 클릭] → [터미널에 명령어 즉시 표시] → [명령어 실행] → [뷰어 업데이트]
```

**예시**: 프로젝트 클릭 시

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ Terminal                │  │ Viewer                  │
├─────────────────────────┤  ├─────────────────────────┤
│                         │  │                         │
│ $ cat project-a  ←──────│──│─── [project-a] 클릭     │
│                         │  │                         │
│ $ █                     │  │  # Project A            │
│                         │  │  ...                    │
└─────────────────────────┘  └─────────────────────────┘
```

- 클릭 즉시 터미널에 명령어 표시 (타이핑 애니메이션 없음)
- 명령어 즉시 실행
- 뷰어에 결과 렌더링

---

## 3. 화면 상태별 명세

### 3.1 초기 화면 (Welcome)

부팅 완료 후 표시되는 기본 화면.

```
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│  ● ○ ○  Terminal            ─ □ × │  │              Welcome              │
├───────────────────────────────────┤  ├───────────────────────────────────┤
│                                   │  │                                   │
│  PORTFOLIO OS v1.0.0              │  │         👋 Welcome!               │
│  Type 'help' for commands.        │  │                                   │
│                                   │  │         I'm Hyeonmin,             │
│  $ █                              │  │         Full-Stack Developer      │
│                                   │  │                                   │
│                                   │  │    ┌──────────┐  ┌──────────┐    │
│                                   │  │    │ Projects │  │ About Me │    │
│                                   │  │    └──────────┘  └──────────┘    │
│                                   │  │                                   │
│                                   │  │         try: ls, whoami, help     │
│                                   │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘
```

**뷰어 버튼 클릭 시**:

- `[Projects]` 클릭 → 터미널에 `$ ls -l` 표시 및 실행
- `[About Me]` 클릭 → 터미널에 `$ whoami` 표시 및 실행

### 3.2 프로젝트 목록 (ls)

```
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│  ● ○ ○  Terminal            ─ □ × │  │  📁 Projects                      │
├───────────────────────────────────┤  ├───────────────────────────────────┤
│                                   │  │                                   │
│  $ ls -l                          │  │  ┌─────────────────────────────┐  │
│                                   │  │  │ 📦 claude-code              │  │
│  NAME            ★    LANG        │  │  │ TypeScript  ★ 128           │  │
│  ──────────────────────────────   │  │  └─────────────────────────────┘  │
│  claude-code    128  TypeScript   │  │                                   │
│  react-app       45  TypeScript   │  │  ┌─────────────────────────────┐  │
│  portfolio       12  TypeScript   │  │  │ 📦 react-app                │  │
│                                   │  │  │ TypeScript  ★ 45            │  │
│  3 projects                       │  │  └─────────────────────────────┘  │
│                                   │  │                                   │
│  $ █                              │  │  ┌─────────────────────────────┐  │
│                                   │  │  │ 📦 portfolio                │  │
│                                   │  │  │ TypeScript  ★ 12            │  │
│                                   │  │  └─────────────────────────────┘  │
│                                   │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘
```

**뷰어 프로젝트 카드 클릭 시**:

- 터미널에 `$ cat <project-name>` 즉시 표시
- 뷰어에 해당 프로젝트 README 렌더링

### 3.3 프로젝트 상세 (cat)

```
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│  ● ○ ○  Terminal            ─ □ × │  │  ← Back    claude-code    ↗ GitHub│
├───────────────────────────────────┤  ├───────────────────────────────────┤
│                                   │  │                                   │
│  $ ls -l                          │  │  # Claude Code                    │
│  ...                              │  │                                   │
│  $ cat claude-code                │  │  An AI-powered coding assistant   │
│                                   │  │  CLI tool.                        │
│  $ █                              │  │                                   │
│                                   │  │  ## Features                      │
│                                   │  │                                   │
│                                   │  │  - Natural language code gen      │
│                                   │  │  - Intelligent code review        │
│                                   │  │  - Multi-language support         │
│                                   │  │                                   │
│                                   │  │  ## Installation                  │
│                                   │  │                                   │
│                                   │  │  ```bash                          │
│                                   │  │  npm install -g claude-code       │
│                                   │  │  ```                              │
│                                   │  │                                   │
│                                   │  │  ────────────────────────────     │
│                                   │  │  ★ 128  |  🍴 23  |  TypeScript   │
│                                   │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘
```

**뷰어 상단 바 동작**:

| 버튼 | 터미널 명령어 | 동작 |
|------|--------------|------|
| `← Back` | `ls -l` | 프로젝트 목록으로 이동 |
| `↗ GitHub` | `open claude-code` | 새 탭에서 GitHub 열기 |

### 3.4 프로필 (whoami)

```
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│  ● ○ ○  Terminal            ─ □ × │  │  👤 About Me                      │
├───────────────────────────────────┤  ├───────────────────────────────────┤
│                                   │  │                                   │
│  $ whoami                         │  │       _   _                       │
│                                   │  │      | | | |_   _  ___  ___  _ __ │
│  $ █                              │  │      | |_| | | | |/ _ \/ _ \| '_ \│
│                                   │  │      |  _  | |_| |  __/ (_) | | | │
│                                   │  │      |_| |_|\__, |\___|\___/|_| |_│
│                                   │  │             |___/                 │
│                                   │  │                                   │
│                                   │  │      Full-Stack Developer         │
│                                   │  │                                   │
│                                   │  │  ────────────────────────────     │
│                                   │  │                                   │
│                                   │  │  SKILLS                           │
│                                   │  │  Frontend  React, TypeScript      │
│                                   │  │  Backend   Node.js, Go            │
│                                   │  │  DevOps    Docker, AWS            │
│                                   │  │                                   │
│                                   │  │  LINKS                            │
│                                   │  │  📧 hello@hyeonmin.dev            │
│                                   │  │  🔗 github.com/hyeonmin           │
│                                   │  │  💼 linkedin.com/in/hyeonmin      │
│                                   │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 4. 터미널 기능

### 4.1 명령어 목록

| 명령어 | 설명 | 뷰어 결과 |
|--------|------|----------|
| `help` | 명령어 목록 표시 | 도움말 카드 |
| `ls [-l]` | 프로젝트 목록 | 프로젝트 카드 그리드 |
| `cat <name>` | README 표시 | 마크다운 렌더링 |
| `open <name>` | GitHub 열기 | 새 탭 열기 |
| `whoami` | 프로필 표시 | 프로필 카드 |
| `clear` | 터미널 초기화 | 뷰어 초기 화면 |
| `history` | 명령어 히스토리 | - |

### 4.2 자동 완성 (Hybrid)

Tab 기반 완성 + 시각적 힌트 조합.

```
┌───────────────────────────────────┐
│  $ cat clau█                      │
│            claude-code ← 힌트(회색)│
└───────────────────────────────────┘
        ↓ Tab 키 입력
┌───────────────────────────────────┐
│  $ cat claude-code█               │
└───────────────────────────────────┘
```

**동작 방식**:

| 입력 상태 | 동작 |
|----------|------|
| 2글자 이상 입력 | 인라인 힌트 표시 (회색 텍스트) |
| Tab 키 | 힌트 내용으로 자동 완성 |
| Tab 키 (여러 후보) | 후보 목록 팝업 표시 |
| ↑↓ 키 | 팝업에서 후보 선택 |
| Enter | 선택 확정 |
| ESC | 팝업 닫기 |

**시각적 표현**:

```
┌───────────────────────────────────┐
│  $ cat cl█aude-code               │  ← 힌트는 회색(#6272a4)
└───────────────────────────────────┘

┌───────────────────────────────────┐  ← Tab 시 여러 후보가 있으면
│  $ cat cl█                        │
│       ┌──────────────┐            │
│       │ claude-code  │ ← 선택 중  │
│       │ cli-tool     │            │
│       └──────────────┘            │
└───────────────────────────────────┘
```

**장점**:

- 터미널 익숙한 사용자: Tab으로 빠른 완성
- 초보 사용자: 힌트로 어떤 명령어가 있는지 학습

### 4.3 에러 처리

```
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│  $ cat unknown-project            │  │                                   │
│                                   │  │    ⚠️ Project Not Found           │
│  cat: unknown-project:            │  │                                   │
│  No such file or directory        │  │    'unknown-project' doesn't      │
│                                   │  │    exist.                         │
│  $ █                              │  │                                   │
│                                   │  │    Available projects:            │
│                                   │  │    • claude-code                  │
│                                   │  │    • react-app                    │
│                                   │  │    • portfolio                    │
│                                   │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 5. 반응형 대응

### 5.1 Desktop (> 1024px)

- 듀얼 패널 50:50 비율
- 터미널 + 뷰어 동시 표시

### 5.2 Tablet (768px ~ 1024px)

- 듀얼 패널 40:60 비율 (뷰어 더 넓게)
- 폰트 크기 유지

### 5.3 Mobile (< 768px)

**Snap Scroll** 방식으로 뷰어/터미널이 화면에 딱 맞춰 전환됨.

```
┌─────────────────────────────────┐
│  📁 Projects          ↗ GitHub │  ← 뷰어 헤더
├─────────────────────────────────┤
│                                 │
│  # Claude Code                  │
│                                 │
│  An AI-powered coding           │
│  assistant CLI tool.            │
│                                 │
│  ## Features                    │
│  - Feature 1                    │
│  - Feature 2                    │
│                                 │
│  ★ 128  |  TypeScript           │
│                                 │
│                                 │
│            ↕ 스와이프            │
└─────────────────────────────────┘
         ↕ snap scroll
┌─────────────────────────────────┐
│  ● ○ ○  Terminal                │
├─────────────────────────────────┤
│                                 │
│  $ cat claude-code              │
│                                 │
│  $ █                            │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│            ↕ 스와이프            │
└─────────────────────────────────┘
```

**Snap Scroll 구현**:

```css
.mobile-container {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}

.viewer-section,
.terminal-section {
  scroll-snap-align: start;
  height: 100vh;
}
```

**모바일 동작**:

- 스크롤(스와이프) 시 뷰어/터미널 영역이 화면에 딱 맞춰 정지
- 각 영역은 화면 전체를 차지 (풀스크린)
- 뷰어에서 버튼 클릭 → 터미널에 명령어 실행 → 결과에 따라 뷰어 업데이트
- 터미널에서 직접 명령어 입력도 가능

---

## 6. 컬러 팔레트 (Dracula)

| 요소 | 색상 코드 | 용도 |
|------|----------|------|
| Background | `#282a36` | 터미널 배경 |
| Current Line | `#44475a` | 현재 라인 하이라이트 |
| Foreground | `#f8f8f2` | 기본 텍스트 |
| Comment | `#6272a4` | 주석, 힌트 |
| Cyan | `#8be9fd` | 명령어 |
| Green | `#50fa7b` | 성공, 체크마크 |
| Orange | `#ffb86c` | 경고 |
| Pink | `#ff79c6` | 프롬프트 $ |
| Purple | `#bd93f9` | 폴더명 |
| Red | `#ff5555` | 에러 |
| Yellow | `#f1fa8c` | 파일명 |

**뷰어 배경**: `#1e1e2e` (터미널보다 약간 어둡게)

---

## 7. 타이포그래피

| 요소 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| 터미널 텍스트 | `JetBrains Mono` | 14px | 400 |
| 뷰어 본문 | `Inter`, sans-serif | 16px | 400 |
| 뷰어 헤딩 (h1) | `Inter` | 28px | 700 |
| 뷰어 헤딩 (h2) | `Inter` | 22px | 600 |
| 코드 블록 | `JetBrains Mono` | 14px | 400 |

---

## 8. 애니메이션 명세

| 애니메이션 | 대상 | 지속 시간 | 이징 |
|-----------|------|----------|------|
| 커서 깜빡임 | 입력 커서 `█` | 1s | step-end |
| 뷰어 전환 | 콘텐츠 페이드 | 150ms | ease-out |
| 자동완성 팝업 | 드롭다운 | 100ms | ease-out |
| 탭 전환 (모바일) | 슬라이드 | 200ms | ease-in-out |
| 버튼 호버 | 배경색 | 100ms | ease |
| README 스트리밍 | 뷰어 마크다운 | 10ms/줄 | linear |

### 8.1 README 스트리밍 효과

`cat` 명령어 실행 시 README가 한 줄씩 렌더링되어 터미널 느낌 극대화.

```typescript
const streamMarkdown = async (content: string) => {
  const lines = content.split('\n');
  let rendered = '';

  for (const line of lines) {
    rendered += line + '\n';
    setViewerContent(rendered);
    await sleep(10); // 10ms 간격
  }
};
```

**동작**:

- README 내용을 줄 단위로 분할
- 10ms 간격으로 한 줄씩 추가 렌더링
- 스크롤은 자동으로 하단 추적
- 사용자가 스크롤하면 자동 추적 중단

---

## 9. URL 상태 관리 (Deep Linking)

명령어 실행 시 URL을 업데이트하여 상태 공유 및 브라우저 히스토리 지원.

### 9.1 URL 패턴

| 상태 | URL | 설명 |
|------|-----|------|
| 초기 화면 | `/` | Welcome 화면 |
| 프로젝트 목록 | `/projects` | `ls -l` 실행 상태 |
| 프로젝트 상세 | `/projects/claude-code` | `cat claude-code` 실행 상태 |
| 프로필 | `/about` | `whoami` 실행 상태 |

### 9.2 동작 흐름

```
[명령어 실행] → [URL 업데이트 (pushState)] → [뷰어 렌더링]
     ↓
[URL 직접 접속 or 새로고침] → [URL 파싱] → [해당 명령어 자동 실행]
```

### 9.3 브라우저 히스토리 지원

| 액션 | 동작 |
|------|------|
| 뒤로가기 (←) | 이전 명령어 상태로 복원 |
| 앞으로가기 (→) | 다음 명령어 상태로 이동 |
| 새로고침 (F5) | 현재 URL 상태 유지 |
| URL 공유 | 동일한 화면으로 바로 진입 |

### 9.4 구현 예시

```typescript
interface ExecuteOptions {
  silent?: boolean;  // true면 URL 업데이트 안 함 (순환 참조 방지)
}

// 명령어 실행 시 URL 업데이트
const executeCommand = (
  cmd: string,
  args: string[],
  options: ExecuteOptions = {}
) => {
  const result = runCommand(cmd, args);

  // silent 모드가 아닐 때만 URL 업데이트 (순환 참조 방지)
  if (!options.silent) {
    const url = getUrlFromCommand(cmd, args);
    history.pushState({ cmd, args }, '', url);
  }

  return result;
};

// URL → 명령어 매핑
const getCommandFromUrl = (pathname: string) => {
  if (pathname === '/') return null;
  if (pathname === '/projects') return { cmd: 'ls', args: ['-l'] };
  if (pathname === '/about') return { cmd: 'whoami', args: [] };
  if (pathname.startsWith('/projects/')) {
    const name = pathname.replace('/projects/', '');
    return { cmd: 'cat', args: [name] };
  }
  return null;
};

// 브라우저 뒤로가기/앞으로가기 처리
window.addEventListener('popstate', (event) => {
  if (event.state) {
    // silent: true로 호출하여 pushState 재호출 방지
    executeCommand(event.state.cmd, event.state.args, { silent: true });
  }
});
```

---

## 10. 접근성 (A11y)

| 항목 | 대응 방안 |
|------|----------|
| 키보드 내비게이션 | 터미널 포커스, Tab으로 뷰어 버튼 이동 |
| 스크린 리더 | ARIA 라벨, 뷰어 콘텐츠 live region |
| 색상 대비 | WCAG AA (4.5:1) 충족 |
| 포커스 표시 | 명확한 포커스 링 |
| 텍스트 크기 | rem 단위 사용 |

---

## 11. 구현 노트 (Implementation Notes)

### 11.1 README 이미지 경로 처리

GitHub API로 가져온 README의 상대 경로 이미지가 깨지지 않도록 빌드 시점에 절대 경로로 변환.

```typescript
// scripts/fetch-projects.ts

const convertImagePaths = (
  markdown: string,
  owner: string,
  repo: string,
  branch: string = 'main'
): string => {
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

  // 마크다운 이미지 문법: ![alt](path)
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt, path) => {
      const absolutePath = path.startsWith('/')
        ? `${baseUrl}${path}`
        : `${baseUrl}/${path}`;
      return `![${alt}](${absolutePath})`;
    }
  );
};

// 사용 예시
const readme = await fetchReadme(repo);
const processedReadme = convertImagePaths(readme, 'hyeonmin', repo.name);
```

**처리 대상**:

| 원본 경로 | 변환 후 |
|----------|--------|
| `./docs/img.png` | `https://raw.githubusercontent.com/.../docs/img.png` |
| `/assets/logo.svg` | `https://raw.githubusercontent.com/.../assets/logo.svg` |
| `https://...` | 그대로 유지 (절대 경로는 변환 안 함) |

### 11.2 빌드 시 데이터 검증

```typescript
// scripts/fetch-projects.ts

const validateProject = (project: Project): boolean => {
  const required = ['name', 'description', 'readme', 'url'];
  return required.every((key) => project[key] != null);
};

// 유효하지 않은 프로젝트는 빌드 경고 출력 후 제외
projects.filter(validateProject);
```
