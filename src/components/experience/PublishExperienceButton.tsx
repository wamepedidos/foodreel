import { Clock3, SendHorizonal } from 'lucide-react';

export function PublishExperienceButton({
  disabled,
  publishing,
  onClick
}: {
  disabled: boolean;
  publishing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {publishing ? (
        <>
          <Clock3 className="size-5 animate-pulse" />
          Publicando...
        </>
      ) : (
        <>
          <SendHorizonal className="size-5" />
          Publicar experiencia
        </>
      )}
    </button>
  );
}
