import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import {
  CRAIntegrationService,
  StudentService,
  SequenceControlService,
  ConfigService,
} from "../services";
import { CRAPersonRecord, CRAUploadResult } from "./cra-integration.models";

/**
 * Manages the retrieval of students or parents or another
 * individual that needs to have his data verified
 * by the Canada Revenue Agency (CRA).
 */
@Injectable()
export class CRAPersonalVerificationService {
  constructor(
    private readonly craService: CRAIntegrationService,
    private readonly studentService: StudentService,
    private readonly configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for CRA processing.
   * In the future more personal verification for others type of
   * individuals (e.g. parents) should be added and they will probably
   * be send as one single batch for CRA processing.
   * @returns SIN validation request.
   */
  public async createSinValidationRequest(): Promise<CRAUploadResult> {
    const students = await this.studentService.getStudentsPendingSinValidation();
    if (!students) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    const craRecords = students.map((student) => {
      return {
        sin: student.sin,
        surname: student.user.lastName,
        givenName: student.user.lastName,
        birthDate: student.birthdate,
      } as CRAPersonRecord;
    });

    const sequenceName = `CRA_${
      this.configService.getConfig().CRAIntegration.programAreaCode
    }`;

    let uploadResult: CRAUploadResult;
    await this.sequenceService.consumeNextSequence(
      sequenceName,
      async (nextSequenceNumber: number) => {
        try {
          const fileContent = this.craService.createMatchingRunContent(
            craRecords,
            nextSequenceNumber,
          );
          const fileName = this.craService.createRequestFileName(
            nextSequenceNumber,
          );
          uploadResult = await this.craService.uploadContent(
            fileContent,
            fileName,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for SIN verification: ${error}`,
          );
          throw error;
        }
      },
    );

    return uploadResult;
  }

  @InjectLogger()
  logger: LoggerService;
}
