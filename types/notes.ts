export type Note = {
  id: string;
  title: string;
  /** True after the user edits the title. */
  titleManual: boolean;
  body: string;
  updatedAt: number;
};

export type NotePhase = "idle" | "suggesting" | "cancelled" | "error";
