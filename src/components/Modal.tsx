"use client";

import clsx from "clsx";
import { MouseEvent, ReactNode, useEffect } from "react";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  width?: string; // e.g. "500px" or "50%"
  height?: string; // e.g. "400px" or "80%"
  hideCloseButton?: boolean;
};

const Modal = ({
  open,
  onClose,
  title,
  children,
  className,
  width = "600px",
  height,
  hideCloseButton = false,
}: ModalProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={handleOverlayClick}>
      <div
        className={clsx(
          "relative bg-white rounded-lg shadow-lg p-6 w-full max-w-[90vw] transition-all duration-300 ease-in-out",
          className
        )}
        style={{ width, height }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {title && (
          <h2 id="modal-title" className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800">
            {title}
          </h2>
        )}

        {/* Modal Content */}
        <div className="overflow-auto max-h-[80vh]">{children}</div>

        {!hideCloseButton && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal;
