import TopNav from '../components/TopNav';
import AIChat from '../components/AIChat';
import PropertiesPanel from '../components/PropertiesPanel';
import CanvasArea from '../components/CanvasArea';
import LeftSidebar from '../components/LeftSidebar';
import CommandPalette from '../components/CommandPalette';
import ToastProvider from '../components/ToastProvider';

export default function Home() {
  console.log('[Home] Rendering AI Canvas page');
  console.log('[Home] Preparing workspace layout');
  console.log('[Home] Rendering canvas area');
  console.log('[Home] Rendering AI chat panel');
  console.log('[Home] Rendering properties panel');

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <section role="status" aria-label="Workspace notifications" className="border-b border-blue-100 bg-blue-50 px-4 py-2">
        <h1 className="text-sm font-semibold text-blue-900">Workspace notifications</h1>
        <ul className="mt-1 text-xs leading-5 text-blue-800">
          <li>Your AI Canvas workspace is ready.</li>
          <li>Create a project to organize a new idea.</li>
          <li>Use the AI Chat panel to explore your canvas.</li>
          <li>Export your work as a PNG or PDF when ready.</li>
          <li>Share your canvas with collaborators.</li>
          <li>Use Ctrl/Cmd+Z to undo canvas edits.</li>
        </ul>
      </section>
      <CommandPalette /><ToastProvider /><TopNav />
      <div className="flex-1 flex overflow-hidden relative"><LeftSidebar /><CanvasArea /><AIChat /><PropertiesPanel /></div>
      <div className="mt-4 text-xs text-slate-500">
        Keep your GitHub streak alive.
        Make a small contribution today.
        Track your progress one day at a time.
        Consistency builds great projects.
        Come back tomorrow and keep going.
      </div>
    </main>
  );
}
