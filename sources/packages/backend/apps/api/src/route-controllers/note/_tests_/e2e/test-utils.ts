import { Note } from "@sims/sims-db";

/**
 * Transform a Note object to the object returned by the API.
 * @param note note to be transformed.
 * @returns an object item for the notes returned by the API.
 */
export function transformNoteToApiReturn(note: Note) {
  return {
    id: note.id,
    noteType: note.noteType,
    description: note.description,
    createdBy: `${note.creator.firstName} ${note.creator.lastName}`,
    createdAt: note.createdAt.toISOString(),
  };
}
