# Portfolio

CLI 스타일의 인터랙티브 포트폴리오 사이트.

## Features

- **Dual Panel Layout**: 터미널 + 뷰어 구조
- **Zsh-style Terminal**: xterm.js 기반, Tab 자동완성, 히스토리 지원
- **Command-Driven UI**: 터미널 명령어로 뷰어 제어
- **Zero-Network Runtime**: 빌드 시 GitHub 데이터 fetch, 런타임에는 정적 JSON 사용

## Commands

| Command | Description |
|---------|-------------|
| `help` | 명령어 목록 |
| `ls` | 프로젝트 목록 |
| `cd <project>` | 프로젝트 디렉토리 이동 |
| `cat <project>` | 프로젝트 상세 보기 |
| `open <project>` | 프로젝트 GitHub 페이지 열기 |
| `whoami` | 프로필 보기 |
| `history` | 명령어 히스토리 |
| `clear` | 화면 지우기 |

## Tech Stack

- React + TypeScript
- Vite + Tailwind CSS
- xterm.js
- GitHub Pages + GitHub Actions

## Development

```bash
pnpm install
pnpm dev
```

## Build & Deploy

```bash
pnpm build
```

GitHub에 푸시하면 GitHub Actions가 자동으로 배포합니다.

## License

MIT
