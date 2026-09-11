"use client";

import { useEffect, useState } from "react";

type SelectionState = { text: string; top: number; left: number } | null;

export default function SelectionSearch() {
  const [selection, setSelection] = useState<SelectionState>(null);

  useEffect(() => {
    function updateSelection() {
      const currentSelection = window.getSelection();
      const text = currentSelection?.toString().trim() ?? "";
      if (!text || !currentSelection?.rangeCount) {
        setSelection(null);
        return;
      }
      const rect = currentSelection.getRangeAt(0).getBoundingClientRect();
      const buttonHeight = 38;
      const top =
        rect.bottom + 8 + buttonHeight <= window.innerHeight
          ? rect.bottom + 8
          : rect.top - buttonHeight - 8;
      setSelection({
        text,
        top: Math.max(8, top),
        left: Math.min(
          Math.max(8, rect.left),
          Math.max(8, window.innerWidth - 190),
        ),
      });
    }

    document.addEventListener("mouseup", updateSelection);
    document.addEventListener("keyup", updateSelection);
    return () => {
      document.removeEventListener("mouseup", updateSelection);
      document.removeEventListener("keyup", updateSelection);
    };
  }, []);

  if (!selection) return null;
  return (
    <button
      className="selection-search"
      style={{ top: selection.top, left: selection.left }}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        window.open(
          `/?q=${encodeURIComponent(selection.text)}`,
          "_blank",
          "noopener,noreferrer",
        )
      }
    >
      Search selected text
    </button>
  );
}
