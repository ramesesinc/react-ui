"use client";

import { UIButtonControl } from "@rameses/ui";
import clsx from "clsx";
import React, { MouseEventHandler, ReactNode, useState } from "react";
import { getError } from "../common/ErrorUtil";

type ButtonType = "button" | "submit";

interface ButtonProps extends Omit<UIButtonControl, "binding" | "onClick"> {
  binding?: UIButtonControl["binding"];
  type?: ButtonType;
  disabled?: boolean;
  children?: ReactNode;

  // override: use proper React click handler
  onClick?: MouseEventHandler<HTMLButtonElement>;

  // styling props
  variant?: "text" | "contained" | "outlined";
  size?: "sm" | "md" | "lg";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loadingText?: React.ReactNode;
  fullWidth?: boolean;

  // external control
  isLoading?: boolean;
}

export default function Button({
  binding,
  type = "button",
  className,
  disabled = false,
  immediate = false,
  onClick,
  children,

  // styling props
  variant = "contained",
  size = "md",
  startIcon,
  endIcon,
  loadingText,
  fullWidth = false,

  // external control
  isLoading = false,
}: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = isLoading || internalLoading;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    try {
      setInternalLoading(true);

      if (!immediate && binding) {
        const validationResult = binding.validate();
        if (validationResult != null && validationResult !== "") {
          return;
        }
      }

      try {
        const result = onClick?.(event);
        if (result) {
          await Promise.resolve(result);
        }
      } catch (err) {
        const e = getError(err);
        binding?.setError(e.message);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const displayText = loading ? loadingText || children : children;

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClasses = {
    text: "bg-transparent text-blue-500 hover:bg-blue-100",
    contained: "bg-blue-500 text-white hover:bg-blue-600",
    outlined: "bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
  };

  const sizeClasses = {
    sm: "text-sm px-3 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  // spinner size based on button size
  const spinnerSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        "rounded-lg", // default shape
        className // user override (e.g., "rounded-full")
      )}
    >
      {loading && (
        <svg
          className={clsx("animate-spin text-current", spinnerSize)}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {!loading && startIcon && <span className="inline-flex">{startIcon}</span>}
      <span>{displayText}</span>
      {!loading && endIcon && <span className="inline-flex">{endIcon}</span>}
    </button>
  );
}
