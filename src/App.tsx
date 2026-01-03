import { TerminalProvider } from '@/context/TerminalContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { DualPanel } from '@/components/Layout/DualPanel';
import { XTerminal } from '@/components/Terminal/XTerminal';
import { Viewer } from '@/components/Viewer/Viewer';
import { useDeepLink } from '@/hooks/useDeepLink';
import { useTerminalContext } from '@/context/TerminalContext';

function AppContent() {
  const { executeCommand } = useTerminalContext();

  // Handle URL-based navigation
  useDeepLink(executeCommand);

  return (
    <DualPanel
      terminal={<XTerminal />}
      viewer={<Viewer />}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <TerminalProvider>
        <AppContent />
      </TerminalProvider>
    </ThemeProvider>
  );
}

export default App;
