import { cn } from "@/lib/utils";

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError = ({ error, className }: FieldErrorProps) => {
  if (!error) return null;

  return (
    <p className={cn("text-sm text-destructive mt-1", className)}>
      {error}
    </p>
  );
};
