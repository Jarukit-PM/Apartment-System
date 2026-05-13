export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap-content-enter flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      {children}
    </div>
  );
}
