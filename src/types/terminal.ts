// Viewer state is now just a path - the FSNode.type determines rendering
export type ViewerState = string;

// Vim editor mode state
export interface VimModeState {
  filePath: string;
  content: string;
}
