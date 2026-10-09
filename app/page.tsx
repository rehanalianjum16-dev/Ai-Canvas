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
      <section className="border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="text-sm font-semibold text-slate-900">
          Welcome to AI Canvas
        </h1>
        <p className="text-xs text-slate-600">Build and explore ideas on your canvas.</p>
      </section>
      <CommandPalette /><ToastProvider /><TopNav />
      <div className="flex-1 flex overflow-hidden relative"><LeftSidebar /><CanvasArea /><AIChat /><PropertiesPanel /></div>
      <div className="mt-4 text-xs text-slate-500">
        Line 1
        Line 2
        Line 3
        Line 4
        Line 5
      </div>
    </main>
  );
}
