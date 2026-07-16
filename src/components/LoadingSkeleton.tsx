export function LoadingSkeleton() {
  return (
    <div className="h-full snap-start px-3 py-4">
      <div className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-card">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 space-y-3 p-5">
          <div className="h-5 w-28 rounded-full bg-white/10" />
          <div className="h-8 w-64 max-w-full rounded-full bg-white/10" />
          <div className="h-4 w-48 rounded-full bg-white/10" />
          <div className="h-12 rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}
