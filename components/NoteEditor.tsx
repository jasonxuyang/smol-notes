"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import type { Note } from "@/types/notes";

type NoteEditorProps = {
  note: Note;
  caret: number;
  suggestion: string;
  disabled: boolean;
  acceptKey?: number;
  onBodyChange: (body: string, caret: number) => void;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onCaretChange: (caret: number) => void;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
};

function prefersCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

const MIRROR_STYLE_PROPS = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "textTransform",
  "lineHeight",
  "textAlign",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
  "tabSize",
] as const;

function scrollTextareaCaretIntoView(
  el: HTMLTextAreaElement,
  bottomGap = 0,
) {
  const style = window.getComputedStyle(el);
  const mirror = document.createElement("div");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.height = "auto";
  mirror.style.overflow = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  for (const prop of MIRROR_STYLE_PROPS) {
    mirror.style[prop] = style[prop];
  }
  mirror.style.width = `${el.clientWidth}px`;

  mirror.textContent = el.value.slice(0, el.selectionEnd);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const caretTop = marker.offsetTop;
  const lineHeight =
    Number.parseFloat(style.lineHeight) || marker.offsetHeight || 20;
  document.body.removeChild(mirror);

  const pad = 8;
  const viewTop = el.scrollTop + pad;
  const viewBottom = el.scrollTop + el.clientHeight - bottomGap - pad;
  const caretBottom = caretTop + lineHeight;

  if (caretTop < viewTop) {
    el.scrollTop = Math.max(0, caretTop - pad);
  } else if (caretBottom > viewBottom) {
    el.scrollTop = caretBottom - el.clientHeight + bottomGap + pad;
  }
}

export function NoteEditor({
  note,
  caret,
  suggestion,
  disabled,
  acceptKey = 0,
  onBodyChange,
  onTitleChange,
  onTitleBlur,
  onCaretChange,
  onAcceptSuggestion,
  onDismissSuggestion,
}: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLPreElement>(null);
  const showGhost = Boolean(suggestion) && !disabled;
  const empty = note.body.trim().length === 0;
  const safeCaret = Math.max(0, Math.min(caret, note.body.length));
  const before = note.body.slice(0, safeCaret);
  const after = note.body.slice(safeCaret);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    if (prefersCoarsePointer()) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
      onCaretChange(end);
      return;
    }
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
    onCaretChange(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [note.id, disabled]);

  const syncCaret = () => {
    const el = textareaRef.current;
    if (!el) return;
    if (suggestion && el.selectionStart !== el.selectionEnd) {
      onDismissSuggestion();
    }
    onCaretChange(el.selectionStart);
  };

  const syncMirrorScroll = () => {
    const el = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!el || !mirror) return;
    mirror.scrollTop = el.scrollTop;
    mirror.scrollLeft = el.scrollLeft;
  };

  useLayoutEffect(() => {
    if (!showGhost) return;
    syncMirrorScroll();
  }, [showGhost, suggestion, note.body, safeCaret]);

  useLayoutEffect(() => {
    if (!acceptKey) return;
    const el = textareaRef.current;
    if (!el) return;

    el.setSelectionRange(safeCaret, safeCaret);
    const bottomGap = prefersCoarsePointer() ? 72 : 0;
    scrollTextareaCaretIntoView(el, bottomGap);
    syncMirrorScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accept-only
  }, [acceptKey]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    const nextCaret = event.target.selectionStart;
    onBodyChange(next, nextCaret);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      if (suggestion) onAcceptSuggestion();
      return;
    }
    if (event.key === "Escape" && suggestion) {
      event.preventDefault();
      onDismissSuggestion();
      return;
    }
  };

  return (
    <div className="note-pane">
      <header className="note-pane__bar">
        <input
          className={
            note.titleManual
              ? "note-pane__title note-pane__title--manual"
              : "note-pane__title"
          }
          type="text"
          value={note.title}
          disabled={disabled}
          spellCheck={false}
          aria-label="Note title"
          title={note.titleManual ? "Custom title" : "Untitled note"}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onTitleBlur}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      </header>

      <div className="note-editor">
        {showGhost ? (
          <pre ref={mirrorRef} className="note-editor__mirror" aria-hidden="true">
            {before}
            <span className="note-editor__ghost">{suggestion}</span>
            <span className="note-editor__inline-hint">
              <kbd>Tab</kbd>
              <span> Accept</span>
              <span className="note-editor__inline-hint-sep"> </span>
              <kbd>Esc</kbd>
              <span> Dismiss</span>
            </span>
            {after}
          </pre>
        ) : null}
        <textarea
          ref={textareaRef}
          className={
            showGhost
              ? "note-editor__input note-editor__input--ghosting"
              : "note-editor__input"
          }
          value={note.body}
          disabled={disabled}
          spellCheck
          placeholder={empty ? "start writing…" : undefined}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={syncCaret}
          onKeyUp={syncCaret}
          onSelect={syncCaret}
          onScroll={syncMirrorScroll}
          aria-label="Note"
        />
        {showGhost ? (
          <div className="note-editor__touch-actions" role="toolbar" aria-label="Suggestion">
            <button
              type="button"
              className="btn note-editor__touch-btn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onAcceptSuggestion}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn btn--danger note-editor__touch-btn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onDismissSuggestion}
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
