import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { StudentService, InstitutionService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  NoteAPIOutDTO,
  NoteAPIInDTO,
  transformToNoteDTO,
  NoteAPIQueryStringAPIInDTO,
} from "./models/note.dto";
import {
  AllowAuthorizedParty,
  UserToken,
  Groups,
  Roles,
} from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Role } from "../../auth/roles.enum";
import { ClientTypeBaseRoute } from "../../types";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { CustomNamedError } from "@sims/utilities";
import { NOTE_CREATION_NOT_AUTHORIZED_FOR_NOTE_CATEGORY } from "../../constants";

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
   * Get notes for a student.
   * @param studentId Student id.
   * @param queryString query string containing note types to filter the notes.
   * @returns student notes.
   */
  @ApiNotFoundResponse({ description: "Student not found." })
  @Get("student/:studentId")
  async getStudentNotes(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query() queryString: NoteAPIQueryStringAPIInDTO,
  ): Promise<NoteAPIOutDTO[]> {
    const student = await this.studentService.getStudentById(studentId);
    if (!student) {
      throw new NotFoundException("Student not found.");
    }
    const studentNotes = await this.studentService.getStudentNotes(studentId, {
      noteTypes: queryString.noteTypes,
    });
    return studentNotes?.map((note) => transformToNoteDTO(note));
  }

  /**
   * Gets notes for an Institution.
   * @param institutionId Institution ID.
   * @param queryString query string containing note types to filter the notes.
   * @returns institution notes.
   */
  @ApiNotFoundResponse({ description: "Institution not found." })
  @Get("institution/:institutionId")
  async getInstitutionNotes(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Query() queryString: NoteAPIQueryStringAPIInDTO,
  ): Promise<NoteAPIOutDTO[]> {
    const institution =
      await this.institutionService.getBasicInstitutionDetailById(
        institutionId,
      );
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }
    const institutionNotes = await this.institutionService.getInstitutionNotes(
      institutionId,
      queryString.noteTypes,
    );
    return institutionNotes?.map((note) => transformToNoteDTO(note)) ?? [];
  }

  /**
   * Add note for an Institution.
   * @param institutionId Institution ID.
   * @param payload Note create object.
   * @returns note id.
   */
  @Roles(Role.InstitutionCreateNote)
  @ApiNotFoundResponse({ description: "Institution not found." })
  @Post("institution/:institutionId")
  async addInstitutionNote(
    @UserToken() userToken: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: NoteAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const institution =
      await this.institutionService.getBasicInstitutionDetailById(
        institutionId,
      );
    if (!institution) {
      throw new NotFoundException("Institution not found.");
    }
    const note = await this.institutionService.addInstitutionNote(
      institutionId,
      payload.noteType,
      payload.description,
      userToken.userId,
    );
    return { id: note.id };
  }

  /**
   * Add note for a Student.
   * @param studentId Student ID.
   * @param payload Note create object.
   * @returns note id.
   */
  @Roles(Role.StudentCreateNote)
  @ApiNotFoundResponse({ description: "Student not found." })
  @ApiForbiddenResponse({
    description:
      "User does not have authorization to create a note for the provided category.",
  })
  @Post("student/:studentId")
  async addStudentNote(
    @UserToken() userToken: IUserToken,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() payload: NoteAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const student = await this.studentService.getStudentById(studentId);
    if (!student) {
      throw new NotFoundException("Student not found.");
    }
    try {
      const note = await this.studentService.addStudentNote(
        studentId,
        payload.noteType,
        payload.description,
        userToken.roles,
        userToken.userId,
      );
      return { id: note.id };
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === NOTE_CREATION_NOT_AUTHORIZED_FOR_NOTE_CATEGORY
      ) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
