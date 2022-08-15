import { IsNotEmpty } from "class-validator";

/**
 * Base DTO for note.
 */
export class NoteBaseAPIInDTO {
  @IsNotEmpty()
  noteType: string;
  @IsNotEmpty()
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export class NoteAPIOutDTO extends NoteBaseAPIInDTO {
  firstName: string;
  lastName: string;
  createdAt: Date;
}
