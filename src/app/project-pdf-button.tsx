"use client";

import { useEffect, useId, useRef, useState } from "react";

export function ProjectPdfButton({
  name,
  href,
}: {
  name: string;
  href: string;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="button outline"
        onClick={() => setOpen(true)}
      >
        Показать проект <span aria-hidden="true">↗</span>
      </button>

      <dialog
        ref={dialogRef}
        className="project-pdf-modal"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="project-pdf-shell">
          <header className="project-pdf-bar">
            <div className="project-pdf-heading">
              <p className="project-pdf-kicker">Проектная документация</p>
              <h2 id={titleId}>{name}</h2>
            </div>
            <div className="project-pdf-bar-actions">
              <a
                className="button light-green"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть PDF
              </a>
              <button
                type="button"
                className="project-pdf-close"
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>
          {open ? (
            <iframe
              className="project-pdf-frame"
              src={`${href}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title={`Проект ${name}`}
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
