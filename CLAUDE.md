# CLAUDE.md

## Language

You must say korean

## 프로젝트 개요

듀얼 패널(터미널 + 뷰어) 구조의 CLI 스타일 포트폴리오 사이트.

## 핵심 원칙

1. **Build-Time Sync**: GitHub API는 빌드 시점에만 호출, 런타임에서는 정적 JSON 사용
2. **Zero-Network**: 모든 명령어는 네트워크 없이 즉시 응답
3. **Command-Driven UI**: 뷰어의 모든 클릭 → 터미널 명령어 실행 → 뷰어 업데이트

## 주요 파일

| 파일 | 용도 |
|-----|------|
| `scripts/fetch-projects.ts` | 빌드 시 GitHub 데이터 fetch |
| `src/data/projects.json` | 정적 프로젝트 데이터 |
| `src/commands/index.ts` | 명령어 레지스트리 |
| `src/hooks/useTerminal.ts` | 터미널 상태 관리 |

## 커맨드

```bash
pnpm dev          # 개발 서버 (사용자가 직접 실행, Claude는 실행하지 말 것)
pnpm build        # 프로덕션 빌드
pnpm fetch-data   # GitHub 데이터 수동 fetch
```

> **주의**: `pnpm dev`는 사용자가 항상 직접 실행합니다. Claude는 개발 서버를 실행하지 마세요.

## 테스트

- 브라우저 테스트가 필요한 경우 Playwright MCP를 사용해 `http://localhost:5173`에서 테스트하세요.
- `pnpm test` 로 e2e 테스트

## 참고 문서

- [PRD.md](./docs/PRD.md) - 요구사항 정의
- [SCREEN_SPEC.md](./docs/SCREEN_SPEC.md) - 화면 기획서
