"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  // id of the heading inside the modal that names it.
  labelledBy: string;
  // "any": Esc or a click outside closes it. "closerequest": Esc only, for
  // forms where a stray click outside shouldn't throw away what was typed.
  closedBy?: "any" | "closerequest";
  children: ReactNode;
};

function isOutside(event: PointerEvent, dialog: HTMLDialogElement) {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

// A native <dialog> opened with showModal(): the browser makes the page behind
// it inert, keeps focus inside, closes it on Esc (and the mobile back gesture),
// and returns focus to the button that opened it. No focus trap or role needed.
export function Modal({ open, onClose, labelledBy, closedBy = "any", children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before showModal(), when the dialog is still
      // closed, so focus the marked field once the dialog is actually open.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Safari doesn't support closedby yet; recreate click-outside-to-close there.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || closedBy !== "any" || "closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const onPointerDown = (event: PointerEvent) => {
      pressedOutside = isOutside(event, dialog);
    };
    // Press and release must both be outside, so a text selection dragged out
    // of the dialog doesn't close it.
    const onPointerUp = (event: PointerEvent) => {
      if (pressedOutside && isOutside(event, dialog)) dialog.close();
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [closedBy]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      closedby={closedBy}
      // Fires however it closed (Esc, outside click, close button), keeping
      // React's open state in sync with the browser's.
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-0 text-foreground shadow-2xl"
    >
      {/* Rendered only while open, so every opening starts from a fresh form. */}
      {open ? <div className="p-5 sm:p-8">{children}</div> : null}
    </dialog>
  );
}
