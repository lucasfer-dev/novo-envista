"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  className?: string;
  children: React.ReactNode;
  pendingText: string;
};

export function AuthSubmitButton({ className, children, pendingText }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingText : children}
    </button>
  );
}
