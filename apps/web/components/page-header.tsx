type Props = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="space-y-2">
      <h1 className="ap-headline">{title}</h1>
      {subtitle ? <p className="ap-body max-w-2xl text-base">{subtitle}</p> : null}
    </header>
  );
}
