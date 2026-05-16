import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  header?: ReactNode;
};

export function AuthImmersiveShell({ children, header }: Props) {
  return (
    <div className="ap-ambient-bg flex min-h-dvh flex-col">
      {header}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:py-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
