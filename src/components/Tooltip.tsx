"use client";

import clsx from "clsx";
import { forwardRef, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "right" | "bottom" | "left";
  delay?: number;
  color?: "dark" | "light" | "primary";
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, position = "top", delay = 0, color = "dark" }, ref) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number }>({
      top: 0,
      left: 0,
    });
    const [hoverTimer, setHoverTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top;
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right;
          break;
      }

      const timer = setTimeout(() => {
        setCoords({ top, left });
        setVisible(true);
      }, delay);

      setHoverTimer(timer);
    };

    const hideTooltip = () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      setVisible(false);
    };

    useEffect(() => {
      return () => {
        if (hoverTimer) clearTimeout(hoverTimer);
      };
    }, [hoverTimer]);

    // position-specific transforms
    const getTransform = () => {
      switch (position) {
        case "top":
          return "translate(-50%, -100%)";
        case "bottom":
          return "translate(-50%, 0%)";
        case "left":
          return "translate(-100%, -50%)";
        case "right":
          return "translate(0%, -50%)";
        default:
          return "translate(-50%, -100%)";
      }
    };

    const colorClasses = {
      dark: "bg-black text-white",
      light: "bg-white text-black border border-gray-300",
      primary: "bg-blue-600 text-white",
    };

    return (
      <div ref={wrapperRef} className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
        {children}
        {visible &&
          createPortal(
            <div
              className={clsx(
                "fixed z-50 px-2 py-1 text-xs rounded shadow pointer-events-none transition-opacity duration-150 whitespace-nowrap",
                colorClasses[color]
              )}
              style={{
                top: coords.top,
                left: coords.left,
                transform: getTransform(),
              }}
            >
              {content}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
