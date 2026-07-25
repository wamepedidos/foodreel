export function GridDishSkeleton() {
  return (
    <article className="flex h-full min-h-[398px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-card sm:min-h-[420px]">
      <div className="aspect-[4/3] shrink-0 animate-pulse bg-white/10" />
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="h-4 w-3/4 rounded-full bg-white/10" />
        <div className="h-4 w-1/2 rounded-full bg-white/10" />
        <div className="h-3 w-full rounded-full bg-white/10" />
        <div className="h-3 w-4/5 rounded-full bg-white/10" />
        <div className="mt-auto h-10 rounded-2xl bg-white/10" />
      </div>
    </article>
  );
}
