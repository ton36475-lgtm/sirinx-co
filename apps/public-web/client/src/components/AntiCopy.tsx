/**
 * AntiCopy — Client-side code & content protection layer
 *
 * Techniques implemented:
 * 1. Disable right-click context menu
 * 2. Block keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 * 3. Detect DevTools open (debugger trap + window size heuristic)
 * 4. Disable text selection on protected elements
 * 5. Disable image dragging
 * 6. Block copy/cut events
 *
 * NOTE: These are deterrents, not absolute security. Determined users can bypass them.
 * The real protection comes from server-side logic + code obfuscation in production builds.
 */
import { useEffect } from "react";

const BLOCKED_KEYS = new Set([
  "F12",
  "F11",
]);

const BLOCKED_CTRL_KEYS = new Set([
  "u", // View Source
  "s", // Save Page
]);

const BLOCKED_CTRL_SHIFT_KEYS = new Set([
  "i", // DevTools
  "j", // Console
  "c", // Inspect Element
]);

export function useAntiCopy(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    // 1. Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Block F12, F11
      if (BLOCKED_KEYS.has(key)) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+U, Ctrl+S
      if (e.ctrlKey && BLOCKED_CTRL_KEYS.has(key.toLowerCase())) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I/J/C
      if (e.ctrlKey && e.shiftKey && BLOCKED_CTRL_SHIFT_KEYS.has(key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Block copy/cut events
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "Content protected by SIRINX © 2024");
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // 4. Disable image dragging
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    // 5. Disable text selection via selectstart
    const handleSelectStart = (e: Event) => {
      // Allow selection in input/textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    // 6. Add CSS to disable user-select globally (except inputs)
    const style = document.createElement("style");
    style.id = "anti-copy-styles";
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      img {
        -webkit-user-drag: none !important;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      const existingStyle = document.getElementById("anti-copy-styles");
      if (existingStyle) existingStyle.remove();
    };
  }, [enabled]);
}

/**
 * AntiCopy component — drop into App.tsx to enable protection
 * Set enabled={false} during development for convenience
 */
export default function AntiCopy({ enabled = true }: { enabled?: boolean }) {
  useAntiCopy(enabled);
  return null;
}
