"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useActiveLanguages } from "./LanguageProvider";
import "./SelectionSearch.css";

type SelectionState = { text: string; top: number; left: number } | null;

export default function () {
  const [activeLanguages] = useActiveLanguages();
  const [selection, setSelection] = useState<SelectionState>(null);

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
      const buttonWidth = 190;
      const buttonHeight = 32;
      const rect = currentSelection.getRangeAt(0).getBoundingClientRect();
      const top = rect.bottom + 8 + buttonHeight <= window.innerHeight ? rect.bottom + 8 : rect.top - buttonHeight - 8;
      setSelection({
        text,
        top: Math.max(8, top),
        left: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - buttonWidth)),
      });
    }

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  if (!selection) {
    return null;
  }

  return (
    <Link
      className="search"
      href={`/search?q=${encodeURIComponent(selection.text)}${activeLanguages.length ? `&lang=${activeLanguages.join(",")}` : ""}`}
      style={{ top: selection.top, left: selection.left }}
      onMouseDown={event => event.preventDefault()}
      onClick={() => setSelection(null)}
    >
      Search selected text
    </Link>
  );
}
