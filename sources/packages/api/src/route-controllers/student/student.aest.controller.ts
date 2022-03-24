import { Controller, Get, Injectable, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StudentFileService } from "src/services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import { AESTStudentFileDTO } from "./models/student.dto";

/**
 * Student controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("students")
@ApiTags("students")
@Injectable()
export class StudentAESTController extends BaseController {
  constructor(private readonly fileService: StudentFileService) {
    super();
  }

  /**
   * This controller returns all student documents uploaded
   * by student uploader.
   * @param studentId
   * @returns list of student documents as StudentUploadFileDTO.
   */
  @Get(":studentId/documents")
  async getAESTStudentFiles(
    @Param("studentId") studentId: number,
  ): Promise<AESTStudentFileDTO[]> {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      studentId,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
      metadata: studentDocument.metadata,
      groupName: studentDocument.groupName,
      updatedAt: studentDocument.updatedAt,
    }));
  }
}
