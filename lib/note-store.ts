import type { Note } from "@/types/notes";

const STORAGE_KEY = "smol-notes.v1";
const MAX_NOTES = 10;

export const DEFAULT_NOTE_TITLE = "Untitled note";

export type NoteStoreData = {
  version: 1;
  activeId: string | null;
  notes: Note[];
};

function emptyStore(): NoteStoreData {
  return { version: 1, activeId: null, notes: [] };
}

function normalizeNote(n: Partial<Note> & { id: string }): Note {
  const titleManual = Boolean(n.titleManual);
  const rawTitle = typeof n.title === "string" ? n.title.trim() : "";
  return {
    id: n.id,
    title: titleManual && rawTitle ? rawTitle : DEFAULT_NOTE_TITLE,
    titleManual,
    body: typeof n.body === "string" ? n.body : "",
    updatedAt: typeof n.updatedAt === "number" ? n.updatedAt : Date.now(),
  };
}

export function loadNoteStore(): NoteStoreData {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as NoteStoreData;
    if (parsed?.version !== 1 || !Array.isArray(parsed.notes)) {
      return emptyStore();
    }
    return {
      version: 1,
      activeId: parsed.activeId ?? null,
      notes: parsed.notes.map((n) => normalizeNote(n)),
    };
  } catch {
    return emptyStore();
  }
}

export function saveNoteStore(store: NoteStoreData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / private mode — ignore
  }
}

export function upsertNote(store: NoteStoreData, note: Note): NoteStoreData {
  const rest = store.notes.filter((n) => n.id !== note.id);
  const notes = [note, ...rest]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_NOTES);
  return {
    version: 1,
    activeId: note.id,
    notes,
  };
}

export function removeNote(store: NoteStoreData, id: string): NoteStoreData {
  const notes = store.notes.filter((n) => n.id !== id);
  return {
    version: 1,
    activeId: store.activeId === id ? null : store.activeId,
    notes,
  };
}

export function listNotes(store: NoteStoreData): Note[] {
  return [...store.notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createEmptyNote(id: string): Note {
  return {
    id,
    title: DEFAULT_NOTE_TITLE,
    titleManual: false,
    body: "",
    updatedAt: Date.now(),
  };
}
