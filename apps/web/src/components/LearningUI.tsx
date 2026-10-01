import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="learning-page-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="learning-loading" role="status">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div className="learning-skeleton" aria-hidden="true" key={i}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="learning-empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="learning-error" role="alert">
      <p>{message}</p>
      {retry && (
        <button className="learning-link" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function LearningDialog({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={`learning-dialog ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
