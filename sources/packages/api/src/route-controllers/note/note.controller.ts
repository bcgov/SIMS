import { Controller, Get, Param, Post, Body, Query } from "@nestjs/common";
import { StudentService, InstitutionService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { NoteType } from "../../database/entities";
import { UserGroups } from "../../auth/user-groups.enum";
import { NoteDTO, NoteBaseDTO } from "./models/note.dto";
import { AllowAuthorizedParty, UserToken, Groups } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { transformToNoteDTO, transformToNoteEntity } from "../../utilities";
/**
 * Controller for Notes.
 * This consists of all Rest APIs for notes.
 */
@Controller("notes")
export class NotesController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  /**
   * Rest API to get notes for a student.
   * @param studentId
   * @param noteType Note type(General|Restriction|System Actions|Program) which is passed to filter the notes.
   * @returns Student Notes.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId")
  async getStudentDetails(
    @Param("studentId") studentId: number,
    @Query("noteType") noteType: string,
  ): Promise<NoteDTO[]> {
    const studentNotes = await this.studentService.getStudentNotes(
      studentId,
      noteType as NoteType,
    );
    return studentNotes?.map((note) => transformToNoteDTO(note));
  }

  /**
   * Rest API to gets notes for an Institution.
   * @param institutionId
   * @param noteType Note type(General|Restriction|System Actions|Program) which is passed to filter the notes.
   * @returns Institution Notes.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/institution/:institutionId")
  async getInstitutionDetails(
    @Param("institutionId") institutionId: number,
    @Query("noteType") noteType: string,
  ): Promise<NoteDTO[]> {
    const institutionNotes = await this.institutionService.getInstitutionNotes(
      institutionId,
      noteType as NoteType,
    );
    return institutionNotes?.map((note) => transformToNoteDTO(note));
  }

  /**
   * Rest API to add note for an Institution.
   * @param userToken
   * @param institutionId
   * @param payload Note create object.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Post("/institution/:institutionId")
  async addInstitutionNote(
    @UserToken() userToken: IUserToken,
    @Param("institutionId") institutionId: number,
    @Body() payload: NoteBaseDTO,
  ): Promise<void> {
    const institutionNote = transformToNoteEntity(payload, userToken.userId);
    await this.institutionService.saveInstitutionNote(
      institutionId,
      institutionNote,
    );
  }

  /**
   * Rest API to add note for a Student.
   * @param userToken
   * @param studentId
   * @param payload Note create object.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Post("/student/:studentId")
  async addStudentNote(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Body() payload: NoteBaseDTO,
  ): Promise<void> {
    const studentNote = transformToNoteEntity(payload, userToken.userId);
    await this.studentService.saveStudentNote(studentId, studentNote);
  }
}
