export type ViewerState =
  | { type: 'directory'; path: string }
  | { type: 'file'; path: string }
  | { type: 'vim'; path: string }
  | { type: 'projects'; detailed: boolean }
  | { type: 'project'; name: string }
  | { type: 'profile' }
  | { type: 'help' }
  | { type: 'error'; message: string; suggestions?: string[] };
