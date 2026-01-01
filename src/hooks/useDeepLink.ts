import { useEffect, useRef } from 'react';

interface DeepLinkCommand {
  cmd: string;
  args: string[];
}

function getCommandFromUrl(pathname: string): DeepLinkCommand | null {
  if (pathname === '/' || pathname === '') {
    return null;
  }

  if (pathname === '/projects') {
    return { cmd: 'ls', args: ['-l'] };
  }

  if (pathname === '/about') {
    return { cmd: 'whoami', args: [] };
  }

  if (pathname.startsWith('/projects/')) {
    const projectName = pathname.replace('/projects/', '');
    if (projectName) {
      return { cmd: 'cat', args: [projectName] };
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
      const fullCommand = [command.cmd, ...command.args].join(' ');
      executeCommandRef.current(fullCommand, { silent: true });
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
          const fullCommand = [command.cmd, ...command.args].join(' ');
          executeCommandRef.current(fullCommand, { silent: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
