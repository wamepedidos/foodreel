import type { ExperiencePostStatus } from '../../types';

const STATUS_LABELS: Record<ExperiencePostStatus, string> = {
  approved: 'Aprobada',
  hidden: 'Oculta',
  pending: 'En revision',
  rejected: 'Rechazada'
};

export function ExperienceStatusBadge({ status }: { status: ExperiencePostStatus }) {
  const isPending = status === 'pending';
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${isPending ? 'border-accent/35 bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/75'}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
