import { useTerminalContext } from '@/context/TerminalContext';
import { Welcome } from './Welcome';
import { ProjectList } from './ProjectList';
import { ProjectDetail } from './ProjectDetail';
import { Profile } from './Profile';
import { Help } from './Help';
import { ErrorView } from './ErrorView';
import { AnimatePresence, motion } from 'motion/react';

export function Viewer() {
  const { state } = useTerminalContext();
  const { viewerState } = state;

  const renderContent = () => {
    switch (viewerState.type) {
      case 'welcome':
        return <Welcome />;
      case 'projects':
        return <ProjectList detailed={viewerState.detailed} />;
      case 'project':
        return <ProjectDetail name={viewerState.name} />;
      case 'profile':
        return <Profile />;
      case 'help':
        return <Help />;
      case 'error':
        return <ErrorView message={viewerState.message} suggestions={viewerState.suggestions} />;
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="h-full bg-viewer-bg overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewerState.type + ('name' in viewerState ? viewerState.name : '')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
