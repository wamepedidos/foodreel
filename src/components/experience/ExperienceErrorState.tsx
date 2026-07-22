import { AlertCircle } from 'lucide-react';

export function ExperienceErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-[20px] border border-red-400/30 bg-red-500/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="size-5 shrink-0 text-red-100" />
        <p className="text-sm leading-5 text-red-100">{message}</p>
      </div>
    </section>
  );
}
