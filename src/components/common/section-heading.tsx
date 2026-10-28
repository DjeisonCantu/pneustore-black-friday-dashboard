export function SectionHeading({ title, question }: { title: string; question?: string }) {
  return (
    <div className="mb-3 flex flex-col gap-0.5">
      <h2 className="text-ds-h3 font-semibold tracking-[-0.015em] text-[var(--color-foreground)]">{title}</h2>
      {question && <p className="text-ds-lg text-[var(--color-muted-foreground)]">{question}</p>}
    </div>
  )
}
