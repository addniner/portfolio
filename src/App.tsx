import { TerminalProvider } from '@/context/TerminalContext';
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
    <TerminalProvider>
      <AppContent />
    </TerminalProvider>
  );
}

export default App;
