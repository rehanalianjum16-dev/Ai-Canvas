import TopNav from '../components/TopNav';
import AIChat from '../components/AIChat';
import PropertiesPanel from '../components/PropertiesPanel';
import CanvasArea from '../components/CanvasArea';
import LeftSidebar from '../components/LeftSidebar';
import CommandPalette from '../components/CommandPalette';
import ToastProvider from '../components/ToastProvider';

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <CommandPalette />
      <ToastProvider />
      <TopNav />
      
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar />
        <CanvasArea />
        <AIChat />
        <PropertiesPanel />
      </div>
    </main>
  );
}
