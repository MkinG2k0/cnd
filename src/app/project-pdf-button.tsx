"use client";

import { Browser } from "@capacitor/browser";
import { useEffect, useId, useRef, useState } from "react";

import {
  browserPdfViewerUrl,
  isCapacitorShell,
} from "../lib/capacitor";
import { AppLoader } from "./app-loader";

function previewSrc(href: string, capacitor: boolean): string {
  if (!capacitor) {
    return `${href}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`;
  }
  return `/pdf-viewer.html?file=${encodeURIComponent(href)}`;
}

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
  const [frameReady, setFrameReady] = useState(false);
  const capacitor = isCapacitorShell();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (open) setFrameReady(false);
  }, [open, href]);

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
                href={capacitor ? browserPdfViewerUrl(href) : href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!capacitor) return;
                  e.preventDefault();
                  void Browser.open({ url: browserPdfViewerUrl(href) });
                }}
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
          <div className="project-pdf-stage">
            {open && !frameReady ? (
              <AppLoader
                className="project-pdf-loader"
                label="Подготовка просмотрщика…"
              />
            ) : null}
            {open ? (
              <iframe
                className="project-pdf-frame"
                src={previewSrc(href, capacitor)}
                title={`Проект ${name}`}
                onLoad={() => setFrameReady(true)}
              />
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
