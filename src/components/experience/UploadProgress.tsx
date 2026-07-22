export function UploadProgress({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-accent">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(5, Math.min(100, progress))}%` }} />
      </div>
    </div>
  );
}
