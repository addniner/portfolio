import { useEffect, useRef } from 'react';
import { cmd } from '@/lib/commands';

function getCommandFromUrl(pathname: string): string | null {
  // Remove base path if present
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalizedPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname;

  if (normalizedPath === '/' || normalizedPath === '') {
    return null;
  }

  if (normalizedPath === '/projects') {
    return cmd.cd('hyeonmin/projects');
  }

  if (normalizedPath === '/about') {
    return cmd.chain(cmd.cd('hyeonmin'), cmd.vim('about.md'));
  }

  if (normalizedPath.startsWith('/projects/')) {
    const projectName = normalizedPath.replace('/projects/', '');
    if (projectName) {
      return cmd.chain(cmd.cd('hyeonmin/projects'), cmd.vim(`${projectName}.md`));
    }
  }

  return null;
}

export function useDeepLink(
  executeCommand: (cmd: string, options?: { silent?: boolean }) => void
) {
  const executeCommandRef = useRef(executeCommand);
  executeCommandRef.current = executeCommand;

  const initializedRef = useRef(false);

  // Handle initial URL on mount (run only once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const command = getCommandFromUrl(window.location.pathname);
    if (command) {
      executeCommandRef.current(command, { silent: true });
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.cmd) {
        const args = event.state.args?.join(' ') || '';
        const fullCommand = `${event.state.cmd} ${args}`.trim();
        executeCommandRef.current(fullCommand, { silent: true });
      } else {
        // Handle direct navigation (no state)
        const command = getCommandFromUrl(window.location.pathname);
        if (command) {
          executeCommandRef.current(command, { silent: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
