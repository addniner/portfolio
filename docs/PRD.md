# PRD: CLI Portfolio (Build-Time Sync & Offline-First)

## 1. 개요 (Project Summary)

**컨셉**: 듀얼 패널(터미널 + 뷰어) 구조로 GitHub 프로젝트들을 탐색할 수 있는 인터랙티브 포트폴리오 사이트. 모든 UI 인터랙션은 터미널 명령어로 변환되어 실행됨.

**핵심 전략**:

| 전략 | 설명 |
|------|------|
| Build-Time Sync | GitHub Actions 빌드 시점에 GitHub API를 호출하여 프로젝트 데이터를 정적 JSON으로 번들링 |
| Static Data Import | 번들된 JSON을 앱에서 직접 import하여 네트워크 요청 없이 즉시 사용 |
| Zero-Network Navigation | 모든 명령어(ls, cat 등)는 네트워크 통신 없이 로컬 데이터만 즉시 반환 |
| Optional Cache | LocalStorage를 활용한 명령어 히스토리 저장 |

---

## 2. 사용자 경험 (User Experience)

### 2.1 첫 방문 (Cold Start)

- 빌드 시점에 이미 데이터가 번들되어 있으므로 추가 로딩 없음
- "System Booting..." 애니메이션은 시각적 연출용으로 짧게(0.5~1초) 유지
- 부팅 완료 후 터미널 프롬프트(`$`)가 즉시 활성화

### 2.2 재방문 (Warm Start)

- 동일한 빠른 로딩 경험 유지
- 이전에 저장된 명령어 히스토리 복원

### 2.3 CLI 인터랙션

| 기능 | 설명 |
|------|------|
| 자동 완성 (Hybrid) | 인라인 힌트 표시 + Tab 키로 완성 (터미널 스타일) |
| 명령어 이력 | ↑, ↓ 방향키로 이전 명령어 탐색 |
| 복사/붙여넣기 | Ctrl+C/V 또는 Cmd+C/V 지원 |

### 2.4 듀얼 패널 구조

좌측 터미널 + 우측 뷰어로 구성된 동기화 인터페이스.

| 패널           | 역할                                           |
|----------------|------------------------------------------------|
| Terminal (좌)  | 명령어 입력, 히스토리 표시                     |
| Viewer (우)    | 명령어 결과를 GUI로 렌더링 (마크다운, 카드 등) |

**동기화 원칙**:

- 뷰어에서 클릭 → 터미널에 명령어 즉시 표시 및 실행 → 뷰어 업데이트
- 터미널에서 직접 입력 → 뷰어 업데이트
- 모바일: Snap Scroll로 뷰어/터미널 풀스크린 전환

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 Build-Time Data Engine

**데이터 수집 (GitHub Actions)**:
- 빌드 시 GitHub API를 호출하여 `portfolio` 토픽을 가진 레포지토리 목록 조회
- 각 레포지토리의 README.md 내용 fetch
- 결과를 정적 JSON 파일로 저장 (`src/data/projects.json`)

**데이터 구조**:

```json
{
  "generated_at": "2026-01-01T12:00:00Z",
  "projects": {
    "project-a": {
      "name": "project-a",
      "description": "프로젝트 설명",
      "readme": "# Markdown content...",
      "stars": 12,
      "forks": 3,
      "language": "TypeScript",
      "url": "https://github.com/user/project-a",
      "homepage": "https://project-a.dev",
      "updated_at": "2025-12-15T10:30:00Z",
      "topics": ["react", "typescript"]
    }
  }
}
```

### 3.2 CLI 모듈

| 명령어 | 설명 |
|--------|------|
| `help` | 사용 가능한 명령어 목록 및 사용법 안내 |
| `ls [-l]` | 프로젝트 목록 출력. `-l` 옵션 시 상세 정보(스타, 언어, 업데이트 날짜) 포함 |
| `cat <name>` | 지정한 프로젝트의 README 내용을 마크다운으로 렌더링 |
| `cd <name>` | 프로젝트 컨텍스트로 이동 (프롬프트 변경: `~/project-a$`) |
| `open [name]` | 프로젝트의 GitHub 페이지를 새 탭에서 열기 |
| `whoami` | 개발자 소개 정보 출력 (기술 스택, 연락처, 링크 등) |
| `clear` | 화면 지우기 |
| `history` | 명령어 히스토리 출력 |

### 3.3 URL 상태 관리 (Deep Linking)

명령어 실행 시 URL을 업데이트하여 상태 공유 및 브라우저 히스토리 지원.

| 상태 | URL | 명령어 |
|------|-----|--------|
| 초기 화면 | `/` | - |
| 프로젝트 목록 | `/projects` | `ls -l` |
| 프로젝트 상세 | `/projects/<name>` | `cat <name>` |
| 프로필 | `/about` | `whoami` |

**지원 기능**:

- 브라우저 뒤로가기/앞으로가기
- 새로고침 시 상태 유지
- URL 공유로 특정 화면 바로 진입

### 3.4 에러 핸들링

| 상황 | 메시지 |
|------|--------|
| 존재하지 않는 명령어 | `command not found: <cmd>. Type 'help' for available commands.` |
| 존재하지 않는 프로젝트 | `cat: <name>: No such file or directory` |
| 인자 누락 | `cat: missing operand. Usage: cat <project-name>` |

---

## 4. 기술 스택 (Technical Stack)

### 4.1 Core

| 구분 | 도구 | 이유 |
|------|------|------|
| Framework | React 18 + Vite | 빠른 개발 환경, 최적화된 번들 크기 |
| Language | TypeScript | 타입 안정성, 자동 완성 지원 |
| Styling | Tailwind CSS | 유틸리티 기반 빠른 스타일링 |
| Routing | react-router-dom | URL 기반 Deep Linking |
| Storage | LocalStorage | 명령어 히스토리 저장 |
| CI/CD | GitHub Actions | 빌드 시 데이터 fetch 및 자동 배포 |
| Hosting | GitHub Pages | 무료, `username.github.io` 도메인 |

### 4.2 CLI 엔진

| 라이브러리 | 용도 |
|-----------|------|
| shell-quote | 명령어 파싱, 공백 포함 인자 처리 (예: `cat "Project Name"`) |
| fuzzysort | 자동 완성 퍼지 매칭 (`cl` → `claude-code`) |

### 4.3 데이터 수집 (Build-Time)

| 라이브러리 | 용도 |
|-----------|------|
| @octokit/rest | GitHub API SDK, 타입 정의 완비 |
| zod | `projects.json` 스키마 검증 |
| fs-extra | 직관적인 파일 조작 API |

### 4.4 뷰어 렌더링

| 라이브러리 | 용도 |
|-----------|------|
| react-markdown | 마크다운 렌더링 |
| remark-gfm | GitHub Flavored Markdown (표, 체크박스) |
| shiki | VS Code 테마 기반 코드 하이라이팅 |

### 4.5 UI 및 애니메이션

| 라이브러리 | 용도 |
|-----------|------|
| motion | 부팅 애니메이션, 패널 전환, 스트리밍 효과 (`motion/react`) |
| lucide-react | 깔끔한 아이콘 (📁, 👤 등) |
| clsx + tailwind-merge | 조건부 클래스 바인딩 |

---

## 5. 아키텍처 (Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Fetch Repos │ -> │ Fetch READMEs│ -> │ Generate JSON│  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                   src/data/projects.json
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Vite Build                           │
│         (JSON이 번들에 포함되어 배포됨)                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Terminal │  │ Commands │  │ LocalStorage         │   │
│  │    UI    │  │  Parser  │  │ (history)            │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 보안 고려사항 (Security)

| 항목 | 대응 방안 |
|------|----------|
| GitHub Token 노출 방지 | 토큰은 GitHub Actions Secrets에만 저장, 클라이언트에 절대 노출 안 함 |
| API Rate Limit | 빌드 타임에만 API 호출하므로 Rate Limit 문제 없음 |
| XSS 방지 | react-markdown이 기본적으로 HTML을 sanitize |
| 민감 정보 | .env 파일은 .gitignore에 포함, 빌드 결과물에 포함 안 됨 |

---

## 7. 개발 마일스톤 (Milestones)

### Step 1: 프로젝트 초기 설정
- [x] Vite + React + TypeScript 프로젝트 생성
- [ ] 폴더 구조 정리 (components, hooks, utils, data, types)
- [ ] ESLint, Prettier 설정
- [ ] 기본 CSS 리셋 및 터미널 폰트 설정

### Step 2: 듀얼 패널 UI 구현

- [ ] Terminal 컴포넌트 (입력창, 히스토리)
- [ ] Viewer 컴포넌트 (결과 렌더링)
- [ ] 패널 동기화 로직
- [ ] 프롬프트 스타일링
- [ ] 반응형 레이아웃 (모바일 탭 전환)

### Step 3: 명령어 시스템 구현
- [ ] 명령어 파서 (command, args, flags 분리)
- [ ] 명령어 레지스트리 (확장 가능한 구조)
- [ ] 기본 명령어 구현 (help, clear, echo)
- [ ] 에러 핸들링

### Step 4: 데이터 Fetch 스크립트 작성
- [ ] GitHub API 호출 유틸리티 (`scripts/fetch-projects.ts`)
- [ ] 로컬 개발용 mock 데이터 생성
- [ ] 데이터 타입 정의

### Step 5: 프로젝트 명령어 구현
- [ ] `ls` 명령어 (목록 출력)
- [ ] `cat` 명령어 (README 렌더링)
- [ ] `cd` / `open` 명령어
- [ ] `whoami` 명령어

### Step 6: UX 개선

- [ ] 실시간 자동 완성 (타이핑 시 자동 팝업)
- [ ] 명령어 히스토리 (↑↓ 키)
- [ ] LocalStorage 연동

### Step 7: CI/CD 및 배포
- [ ] GitHub Actions 워크플로우 작성
- [ ] 빌드 시 데이터 fetch 통합
- [ ] GitHub Pages 배포 설정
- [ ] 커스텀 도메인 설정 (선택)

---

## 8. 디렉토리 구조 (Proposed)

```
portfolio/
├── .github/
│   └── workflows/
│       └── deploy.yml          # 빌드 & 배포 워크플로우
├── docs/
│   └── PRD.md                  # 이 문서
├── scripts/
│   └── fetch-projects.ts       # 빌드 시 실행되는 데이터 fetch 스크립트
├── src/
│   ├── components/
│   │   ├── Terminal/
│   │   │   ├── Terminal.tsx
│   │   │   ├── Terminal.module.css
│   │   │   ├── Prompt.tsx
│   │   │   └── AutoComplete.tsx
│   │   ├── Viewer/
│   │   │   ├── Viewer.tsx
│   │   │   ├── Viewer.module.css
│   │   │   ├── Welcome.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── ErrorView.tsx
│   │   └── Markdown/
│   │       └── MarkdownRenderer.tsx
│   ├── commands/
│   │   ├── index.ts            # 명령어 레지스트리
│   │   ├── help.ts
│   │   ├── ls.ts
│   │   ├── cat.ts
│   │   ├── cd.ts
│   │   ├── open.ts
│   │   ├── whoami.ts
│   │   └── clear.ts
│   ├── hooks/
│   │   ├── useTerminal.ts
│   │   ├── useCommandHistory.ts
│   │   └── useAutoComplete.ts
│   ├── data/
│   │   └── projects.json       # 빌드 시 생성되는 정적 데이터
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── commandParser.ts
│   │   └── storage.ts
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 9. 성공 지표 (Success Metrics)

| 지표 | 목표 |
|------|------|
| First Contentful Paint (FCP) | < 1초 |
| Time to Interactive (TTI) | < 1.5초 |
| 번들 크기 (gzipped) | < 100KB |
| Lighthouse Performance | > 90점 |

---

## 10. 향후 확장 가능성

- **블로그 통합**: `blog` 명령어로 게시글 목록 조회
- **이스터에그**: 숨겨진 명령어 (예: `sudo`, `rm -rf`)
- **다국어 지원**: `lang ko/en` 명령어
- **접근성**: 스크린 리더 지원, 키보드 네비게이션 개선
