export type ViewerState =
  | { type: 'welcome' }
  | { type: 'projects'; detailed: boolean }
  | { type: 'project'; name: string }
  | { type: 'profile' }
  | { type: 'help' }
  | { type: 'error'; message: string; suggestions?: string[] };
