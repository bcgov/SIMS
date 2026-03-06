import { Controller, Get, Param, Query, ParseIntPipe } from "@nestjs/common";
import { StudentService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  NoteAPIOutDTO,
  NoteAPIQueryStringApiInDTO,
  transformToNoteDTO,
} from "./models/note.dto";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";

/**
 * Institution Controller for Notes.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId")
@Controller("note")
@ApiTags(`${ClientTypeBaseRoute.Institution}-note`)
export class NoteInstitutionsController extends BaseController {
  constructor(private readonly studentService: StudentService) {
    super();
  }

  /**
   * Get notes for a student.
   * @param studentId student id.
   * @param queryString query string containing note types to filter the notes.
   * @returns student notes.
   */
  @Get("student/:studentId")
  async getStudentNotes(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query() queryString: NoteAPIQueryStringApiInDTO,
  ): Promise<NoteAPIOutDTO[]> {
    const studentNotes = await this.studentService.getStudentNotes(
      studentId,
      queryString.noteTypes,
      { filterNoEffectRestrictionNotes: true },
    );
    return studentNotes?.map((note) => transformToNoteDTO(note));
  }
}
