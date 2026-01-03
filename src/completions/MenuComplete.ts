/**
 * MenuComplete - Zsh의 menu-complete widget 구현
 *
 * Zsh에서 Tab을 누르면:
 * 1. 첫 번째 Tab: 공통 접두사까지 완성 (후보 표시 없음)
 * 2. 두 번째 Tab: 첫 번째 후보로 교체 (인라인)
 * 3. 이후 Tab: 다음 후보로 순환 (인라인)
 *
 * 이 클래스는 menu cycling 상태를 관리
 */

import { getCompletionResult, createContext } from './index';

export interface MenuState {
  /** 현재 선택된 인덱스 (-1 = 선택 안됨) */
  index: number;
  /** 완성 후보들 */
  completions: string[];
  /** Tab 시작 시점의 원본 입력 */
  originalInput: string;
  /** 원본 입력의 prefix */
  originalPrefix: string;
  /** 현재 작업 디렉토리 */
  cwd?: string;
}

export interface MenuCompleteResult {
  /** 새 버퍼 내용 */
  newBuffer: string;
  /** 삽입할 suffix (단일 완성용) */
  suffix?: string;
  /** 표시할 완성 후보들 (하이라이트 포함) */
  displayCompletions?: { items: string[]; selectedIndex: number };
  /** 메뉴 상태 (cycling용) */
  menuState?: MenuState;
}

export class MenuComplete {
  private state: MenuState | null = null;

  /**
   * Tab 키 처리
   * @param buffer 현재 입력 버퍼
   * @param cwd 현재 작업 디렉토리
   * @returns 처리 결과
   */
  complete(buffer: string, cwd?: string): MenuCompleteResult | null {
    // Cycling 모드
    if (this.state) {
      return this.cycleNext();
    }

    // 첫 번째 Tab
    return this.firstComplete(buffer, cwd);
  }

  /**
   * 첫 번째 Tab 처리
   */
  private firstComplete(buffer: string, cwd?: string): MenuCompleteResult | null {
    const result = getCompletionResult(buffer, cwd);
    if (!result || result.completions.length === 0) {
      return null;
    }

    const ctx = createContext(buffer, cwd);

    // 단일 완성
    if (result.completions.length === 1) {
      const suffix = result.completions[0].slice(ctx.prefix.length);
      if (suffix) {
        return { newBuffer: buffer + suffix, suffix };
      }
      return null;
    }

    // 여러 완성 - 공통 접두사까지 완성하고 menu 상태 시작
    const commonPrefix = result.commonPrefix || '';
    const commonSuffix = commonPrefix.slice(ctx.prefix.length);

    let newBuffer = buffer;
    if (commonSuffix) {
      newBuffer = buffer + commonSuffix;
    }

    // Menu 상태 시작 (다음 Tab부터 cycling)
    this.state = {
      index: -1,
      completions: result.completions,
      originalInput: newBuffer,
      originalPrefix: ctx.prefix + commonSuffix,
    };

    // 공통 접두사만 완성, 다음 Tab 대기
    if (commonSuffix) {
      return {
        newBuffer,
        menuState: this.state,
      };
    }

    // 공통 접두사가 없으면 바로 메뉴 표시 + 첫 번째 후보 선택
    this.state.index = 0;
    const firstCompletion = this.state.completions[0];
    const baseInput = newBuffer.slice(0, newBuffer.length - this.state.originalPrefix.length);

    return {
      newBuffer: baseInput + firstCompletion,
      displayCompletions: {
        items: this.state.completions,
        selectedIndex: 0,
      },
      menuState: this.state,
    };
  }

  /**
   * Cycling: 다음 후보로 이동 + 메뉴 표시
   */
  private cycleNext(): MenuCompleteResult | null {
    if (!this.state) return null;

    this.state.index = (this.state.index + 1) % this.state.completions.length;
    const completion = this.state.completions[this.state.index];

    // 원본 입력에서 prefix를 completion으로 교체
    const baseInput = this.state.originalInput.slice(
      0,
      this.state.originalInput.length - this.state.originalPrefix.length
    );
    const newBuffer = baseInput + completion;

    return {
      newBuffer,
      displayCompletions: {
        items: this.state.completions,
        selectedIndex: this.state.index,
      },
      menuState: this.state,
    };
  }

  /**
   * Menu 상태 리셋 (Tab 외의 키 입력 시)
   */
  reset(): void {
    this.state = null;
  }

  /**
   * 현재 cycling 중인지
   */
  isActive(): boolean {
    return this.state !== null;
  }
}
