import { Controller, Get, Param, Patch, Body } from "@nestjs/common";
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
   * @param noteType
   * @returns Notes
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId/:noteType?")
  async getStudentDetails(
    @Param("studentId") studentId: number,
    @Param("noteType") noteType: string,
  ): Promise<NoteDTO[]> {
    const studentNotes = await this.studentService.getStudentNotes(
      studentId,
      noteType as NoteType,
    );
    if (!studentNotes) {
      return [];
    }
    return studentNotes.map((note) => transformToNoteDTO(note));
  }

  /**
   * Rest API to gets notes for an Institution.
   * @param institutionId
   * @param noteType
   * @returns Notes.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/institution/:institutionId/:noteType?")
  async getInstitutionDetails(
    @Param("institutionId") institutionId: number,
    @Param("noteType") noteType: string,
  ): Promise<NoteDTO[]> {
    const institutionNotes = await this.institutionService.getInstitutionNotes(
      institutionId,
      noteType as NoteType,
    );

    if (!institutionNotes) {
      return [];
    }
    return institutionNotes.map((note) => transformToNoteDTO(note));
  }

  /**
   * Rest API to add note for an Institution.
   * @param userToken
   * @param institutionId
   * @param payload
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Patch("/institution/:institutionId")
  async addInstitutionNote(
    @UserToken() userToken: IUserToken,
    @Param("institutionId") institutionId: number,
    @Body() payload: NoteBaseDTO,
  ): Promise<void> {
    const institutionNote = transformToNoteEntity(payload, userToken.userId);
    console.log(institutionNote);
    await this.institutionService.saveInstitutionNote(
      institutionId,
      institutionNote,
    );
  }

  /**
   * Rest API to add note for a Student.
   * @param userToken
   * @param studentId
   * @param payload
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Patch("/student/:studentId")
  async addStudentNote(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Body() payload: NoteBaseDTO,
  ): Promise<void> {
    const studentNote = transformToNoteEntity(payload, userToken.userId);
    await this.studentService.saveStudentNote(studentId, studentNote);
  }
}
