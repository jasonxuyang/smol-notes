"use client";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import type { Note } from "@/types/notes";

type EmptySidePanelProps = {
  past: Note[];
  onOpenPast: (id: string) => void;
};

function formatWhen(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

/** Right-pane empty state: project blurb + recent notes. */
export function EmptySidePanel({ past, onOpenPast }: EmptySidePanelProps) {
  return (
    <div className="empty-side">
      <div className="intro">
        <p className="intro__lead">{SITE_NAME}</p>
        <p className="intro__body">{SITE_DESCRIPTION}</p>
      </div>

      {past.length > 0 ? (
        <div className="past empty-side__past">
          <div className="past__head">
            <span>recent notes</span>
          </div>
          <ul className="past__list">
            {past.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="past__item"
                  onClick={() => onOpenPast(n.id)}
                >
                  <span className="past__title">{n.title}</span>
                  <span className="past__when">{formatWhen(n.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
