"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./SelectionSearch.css";

type SelectionState = { text: string; top: number; left: number } | null;

export default function () {
  const [selection, setSelection] = useState<SelectionState>(null);
  const router = useRouter();

  useEffect(() => {
    function onSelectionChange() {
      const currentSelection = window.getSelection();
      if (!currentSelection || currentSelection.isCollapsed || currentSelection.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const text = currentSelection.toString().trim();
      if (!text) {
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

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  if (!selection) return null;
  return (
    <button

      style={{ top: selection.top, left: selection.left }}
      type="button"
      onMouseDown={event => event.preventDefault()}
      onClick={() => { router.push(`/search?q=${encodeURIComponent(selection.text)}`); setSelection(null); }}
    >
      Search selected text
    </button>
  );
}
