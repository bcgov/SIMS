import { Controller, Get, Param, Patch, Body } from "@nestjs/common";
import { StudentService, InstitutionService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { NoteType, Note, User } from "../../database/entities";
import { UserGroups } from "../../auth/user-groups.enum";
import { NoteDTO } from "./models/note.dto";
import { AllowAuthorizedParty, UserToken, Groups } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";

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
    @UserToken() userToken: IUserToken,
  ): Promise<NoteDTO[]> {
    console.log(userToken);
    const notes = await this.institutionService.getInstitutionNotes(
      institutionId,
      noteType as NoteType,
    );
    console.log(notes);
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
  @Patch("/institution/:institutionId")
  async addInstitutionNote(
    @UserToken() userToken: IUserToken,
    @Param("institutionId") institutionId: number,
    @Body() payload: NoteDTO,
  ): Promise<void> {
    console.log(userToken);
    const institutionNote = {
      noteType: payload.noteType,
      description: payload.description,
      creator: { id: userToken.userId } as User,
    } as Note;
    await this.institutionService.saveInstitutionNote(
      institutionId,
      institutionNote,
    );
  }

  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Patch("/student/:studentId")
  async addStudentNote(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Body() payload: NoteDTO,
  ): Promise<void> {
    const studentNote = {
      noteType: payload.noteType,
      description: payload.description,
      creator: { id: userToken.userId } as User,
    } as Note;
    await this.studentService.saveStudentNote(studentId, studentNote);
  }
}
