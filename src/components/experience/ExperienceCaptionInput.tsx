export function ExperienceCaptionInput({
  error,
  onChange,
  value
}: {
  error?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const normalizedLength = value.length;

  return (
    <label className="block">
      <span className="text-sm font-black text-white">{'Cu\u00e9ntanos tu experiencia'}</span>
      <textarea
        className="mt-3 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-base px-4 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-muted focus:border-accent/60"
        maxLength={300}
        onBlur={() => onChange(value.replace(/\s+/g, ' ').trim())}
        onChange={(event) => onChange(event.target.value.replace(/[ \t]{2,}/g, ' '))}
        placeholder={'\u00bfQu\u00e9 te pareci\u00f3 el plato, la atenci\u00f3n o el momento?'}
        value={value}
      />
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="text-xs text-red-100">{error}</p>
        <span className={`shrink-0 text-xs font-bold ${normalizedLength > 280 ? 'text-accent' : 'text-muted'}`}>{normalizedLength}/300</span>
      </div>
    </label>
  );
}
