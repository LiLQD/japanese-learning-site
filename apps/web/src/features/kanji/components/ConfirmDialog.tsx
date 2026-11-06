import { useEffect, type ReactNode } from "react";

type ConfirmDialogProps = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel: string;
  isBusy: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Small modal used to confirm destructive actions such as deleting a kanji.
function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel,
  isBusy,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Escape closes the dialog, except while the request is running.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onCancel]);

  return (
    <div className="kanji-dialog-backdrop">
      <div
        className="kanji-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kanji-dialog-title"
      >
        <h2 id="kanji-dialog-title">{title}</h2>
        <div className="kanji-dialog-body">{children}</div>

        {errorMessage && (
          <p className="kanji-dialog-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="kanji-dialog-actions">
          <button
            type="button"
            className="kanji-button-secondary"
            onClick={onCancel}
            disabled={isBusy}
            autoFocus
          >
            Hủy
          </button>
          <button
            type="button"
            className="kanji-button-danger"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
