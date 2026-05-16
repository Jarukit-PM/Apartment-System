type Props = {
  message: string;
};

/** Accessible inline alert for auth form server errors. */
export function AuthFormError({ message }: Props) {
  return (
    <p className="text-sm text-red-600" role="alert" aria-live="polite">
      {message}
    </p>
  );
}
