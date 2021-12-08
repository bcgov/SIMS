import { Controller, Get, Param } from "@nestjs/common";
import { StudentService, InstitutionService } from "../../services";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { NoteType } from "../../database/entities";
import { UserGroups } from "../../auth/user-groups.enum";
import { Groups } from "../../auth/decorators";
import { NoteDTO } from "./models/note.dto";

@Controller("notes")
export class NotesController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId/:noteType?")
  async getStudentDetails(
    @Param("studentId") studentId: number,
    @Param("noteType") noteType: string,
  ): Promise<NoteDTO[]> {
    const notes = await this.studentService.getStudentNotes(
      studentId,
      noteType as NoteType,
    );
    if (!notes) {
      return [];
    }
    return notes.map((note) => ({
      noteType: note.noteType,
      description: note.description,
      firstName: note.creator.firstName,
      lastName: note.creator.lastName,
      createdAt: note.createdAt,
    }));
  }

  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/institution/:institutionId/:noteType?")
  async getInstitutionDetails(
    @Param("institutionId") institutionId: number,
    @Param("noteType") noteType: string,
  ): Promise<NoteDTO[]> {
    const notes = await this.institutionService.getInstitutionNotes(
      institutionId,
      noteType as NoteType,
    );
    if (!notes) {
      return [];
    }
    return notes.map((note) => ({
      noteType: note.noteType,
      description: note.description,
      firstName: note.creator.firstName,
      lastName: note.creator.lastName,
      createdAt: note.createdAt,
    }));
  }
}
