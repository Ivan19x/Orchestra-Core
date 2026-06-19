import { Download as DownloadIcon, Clock } from 'lucide-react';

function getDownloadUrl(): string | null {
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
  if (isMac) return import.meta.env.VITE_DOWNLOAD_URL_MAC || null;
  return import.meta.env.VITE_DOWNLOAD_URL_WIN || null;
}

export function DownloadPanel() {
  const downloadUrl = getDownloadUrl();

  return (
    <div className="p-8 rounded-2xl border border-border bg-background text-center">
      <p className="text-sm text-warm-muted mb-6 leading-relaxed">
        One download gets you everything: the Orchestra-Core app, plus the AI models it runs
        on (qwen2.5, moondream, and a small embeddings model) — about 6–7GB in total. The
        first time you open the app, it downloads these automatically in the background;
        you'll see clear progress in the sidebar, no separate installer windows.
      </p>

      {downloadUrl ? (
        <a href={downloadUrl} download
          className="w-full inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
          <DownloadIcon className="w-4 h-4" /> Download Orchestra-Core
        </a>
      ) : (
        <div className="w-full flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-border text-warm-muted text-sm">
          <Clock className="w-4 h-4" /> Download coming soon — sign up for early access
        </div>
      )}
    </div>
  );
}
