import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  ParseIntPipe,
  NotFoundException,
  ParseEnumPipe,
} from "@nestjs/common";
import { StudentService, InstitutionService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { NoteType } from "../../database/entities";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  NoteAPIOutDTO,
  NoteBaseAPIInDTO,
  transformToNoteDTO,
  transformToNoteEntity,
} from "./models/note.dto";
import {
  AllowAuthorizedParty,
  UserToken,
  Groups,
  Roles,
} from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "../../auth/roles.enum";
import { ClientTypeBaseRoute } from "../../types";
/**
 * Controller for Notes.
 * This consists of all Rest APIs for notes.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("note")
@ApiTags(`${ClientTypeBaseRoute.AEST}-note`)
export class NoteAESTController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  /**
   * Rest API to get notes for a student.
   * @param studentId Student id.
   * @param noteType Note type enum which is passed to filter the notes.
   * @returns Student Notes.
   */
  @Get("student/:studentId")
  async getStudentDetails(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query("noteTypem", new ParseEnumPipe(NoteType)) noteType: NoteType,
  ): Promise<NoteAPIOutDTO[]> {
    const studentNotes = await this.studentService.getStudentNotes(
      studentId,
      noteType,
    );
    return studentNotes?.map((note) => transformToNoteDTO(note));
  }

  /**
   * Rest API to gets notes for an Institution.
   * @param institutionId Institution id.
   * @param noteType Note type enum which is passed to filter the notes.
   * @returns Institution Notes.
   */
  @ApiNotFoundResponse({ description: "Institution not found." })
  @Get("/institution/:institutionId")
  async getInstitutionDetails(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Query("noteType", new ParseEnumPipe(NoteType)) noteType: NoteType,
  ): Promise<NoteAPIOutDTO[]> {
    const institution =
      this.institutionService.getBasicInstitutionDetailById(institutionId);
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }
    const institutionNotes = await this.institutionService.getInstitutionNotes(
      institutionId,
      noteType,
    );
    return institutionNotes?.map((note) => transformToNoteDTO(note));
  }

  /**
   * Rest API to add note for an Institution.
   * @param institutionId Institution id.
   * @param payload Note create object.
   */

  @Roles(Role.InstitutionCreateNote)
  @ApiNotFoundResponse({ description: "Institution not found." })
  @Post("institution/:institutionId")
  async addInstitutionNote(
    @UserToken() userToken: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: NoteBaseAPIInDTO,
  ): Promise<void> {
    const institution =
      this.institutionService.getBasicInstitutionDetailById(institutionId);
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }
    const institutionNote = transformToNoteEntity(payload, userToken.userId);
    await this.institutionService.saveInstitutionNote(
      institutionId,
      institutionNote,
    );
  }

  /**
   * Rest API to add note for a Student.
   * @param studentId student id.
   * @param payload Note create object.
   */

  @Roles(Role.StudentCreateNote)
  @Post("student/:studentId")
  async addStudentNote(
    @UserToken() userToken: IUserToken,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() payload: NoteBaseAPIInDTO,
  ): Promise<void> {
    const studentNote = transformToNoteEntity(payload, userToken.userId);
    await this.studentService.saveStudentNote(studentId, studentNote);
  }
}
