import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from "@nestjs/common";
import { StudentService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { NoteType } from "@sims/sims-db";
import { NoteAPIOutDTO, transformToNoteDTO } from "./models/note.dto";
import {
  AllowAuthorizedParty,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ParseEnumQueryPipe } from "../utils/custom-validation-pipe";

/**
 * Institution Controller for Notes.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@Controller("note")
@ApiTags(`${ClientTypeBaseRoute.Institution}-note`)
export class NoteInstitutionsController extends BaseController {
  constructor(private readonly studentService: StudentService) {
    super();
  }

  /**
   * Get notes for a student.
   * @param studentId student id.
   * @param noteType note type enum which is passed to filter the notes.
   * @returns student notes.
   */
  @ApiNotFoundResponse({ description: "Student not found." })
  @Get("student/:studentId")
  async getStudentNotes(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query("noteType", new ParseEnumQueryPipe(NoteType)) noteType?: NoteType,
  ): Promise<NoteAPIOutDTO[]> {
    const student = await this.studentService.getStudentById(studentId);
    if (!student) {
      throw new NotFoundException("Student not found.");
    }
    const studentNotes = await this.studentService.getStudentNotes(
      studentId,
      noteType,
      { filterNoEffectRestrictionNotes: true },
    );
    return studentNotes?.map((note) => transformToNoteDTO(note));
  }
}
