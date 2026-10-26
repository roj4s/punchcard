export function StampRow({ stamps, total }: { stamps: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={`${stamps} of ${total} stamps`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`size-7 rounded-full border-2 ${i < stamps ? "border-amber-600 bg-amber-500" : "border-stone-300"}`}
        />
      ))}
    </div>
  );
}
