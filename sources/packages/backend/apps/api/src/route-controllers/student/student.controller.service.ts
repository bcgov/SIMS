import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApplicationService,
  StudentFileService,
  StudentRestrictionService,
  StudentService,
} from "../../services";
import { FileCreateAPIOutDTO } from "../models/common.dto";
import {
  ApplicationPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  allowApplicationChangeRequest,
  getUserFullName,
} from "../../utilities";
import {
  CustomNamedError,
  getISODateOnlyString,
  parseJSONError,
} from "@sims/utilities";
import {
  AddressInfo,
  Application,
  SFASIndividual,
  SpecificIdentityProviders,
  Student,
  VirusScanStatus,
} from "@sims/sims-db";
import {
  ApplicationSummaryAPIOutDTO,
  SearchStudentAPIOutDTO,
  StudentProfileAPIOutDTO,
  StudentFileDetailsAPIOutDTO,
  StudentUploadFileAPIOutDTO,
  InstitutionStudentProfileAPIOutDTO,
  AESTStudentProfileAPIOutDTO,
  AESTStudentFileDetailsAPIOutDTO,
  LegacyStudentProfileAPIOutDTO,
} from "./models/student.dto";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
import { ApiProcessError } from "../../types";
import { FILE_HAS_NOT_BEEN_SCANNED_YET, VIRUS_DETECTED } from "../../constants";
import { ObjectStorageService } from "@sims/integrations/object-storage";
import { NoSuchKey } from "@aws-sdk/client-s3";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { SFASIndividualService } from "@sims/services";

@Injectable()
export class StudentControllerService {
  constructor(
    private readonly fileService: StudentFileService,
    private readonly studentService: StudentService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly applicationService: ApplicationService,
    private readonly objectStorageService: ObjectStorageService,
    private readonly sfasIndividualService: SFASIndividualService,
  ) {}

  /**
   * Allow files uploads to a particular student.
   * @param studentId student id.
   * @param file file content.
   * @param uniqueFileName unique file name (name+guid).
   * @param groupName friendly name to group files. Currently using
   * the value from 'Directory' property from form.IO file component.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns created file information.
   */
  async uploadFile(
    studentId: number,
    file: Express.Multer.File,
    uniqueFileName: string,
    groupName: string,
    auditUserId: number,
  ): Promise<FileCreateAPIOutDTO> {
    const summary = new ProcessSummary();
    try {
      await this.fileService.createFile(
        {
          fileName: file.originalname,
          uniqueFileName: uniqueFileName,
          mimeType: file.mimetype,
          fileContent: file.buffer,
          groupName: groupName,
        },
        studentId,
        auditUserId,
        summary,
      );
    } catch (error: unknown) {
      summary.error(`File ${file.originalname} saving failed.`, error);
      if (error instanceof CustomNamedError) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        "Unexpected error while saving the file.",
      );
    } finally {
      this.logger.logProcessSummary(summary);
    }
    return {
      fileName: file.originalname,
      uniqueFileName,
      url: `student/files/${uniqueFileName}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Get a student file and write it to the HTTP response.
   * @param response represents the response object that will be returned from
   * the API and the one that will be changed to allow the file download,
   * adding the necessary headers and writing the file content to its stream.
   * @param uniqueFileName unique file name (name+guid).
   * @param studentId student id.
   */
  async writeFileToResponse(
    response: Response,
    uniqueFileName: string,
    studentId?: number,
  ) {
    const studentFile = await this.fileService.getStudentFile(
      uniqueFileName,
      studentId,
    );

    if (!studentFile) {
      throw new NotFoundException(
        "Requested file was not found or the user does not have access to it.",
      );
    }
    if (studentFile.virusScanStatus === VirusScanStatus.VirusDetected) {
      throw new ForbiddenException(
        new ApiProcessError(
          "The original file was deleted due to security rules. Please re-check file and attempt to upload again.",
          VIRUS_DETECTED,
        ),
      );
    }
    if (
      studentFile.virusScanStatus === VirusScanStatus.Pending ||
      studentFile.virusScanStatus === VirusScanStatus.InProgress
    ) {
      throw new ForbiddenException(
        new ApiProcessError(
          "This file has not been scanned and will be available to download once it is determined to be safe.",
          FILE_HAS_NOT_BEEN_SCANNED_YET,
        ),
      );
    }

    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(studentFile.fileName)}`,
    );

    try {
      this.logger.log(
        `Downloading the file ${studentFile.fileName} from S3 storage.`,
      );
      const fileContent = await this.objectStorageService.getObject(
        uniqueFileName,
      );
      this.logger.log(
        `Downloaded the file ${studentFile.fileName} from S3 storage.`,
      );
      // Populate file information received from S3 storage.
      response.setHeader("Content-Type", fileContent.contentType);
      response.setHeader("Content-Length", fileContent.contentLength);
      fileContent.body.pipe(response);
    } catch (error: unknown) {
      if (error instanceof NoSuchKey) {
        this.logger.log(
          `File ${studentFile.fileName} is not present on S3 storage.`,
        );
      } else {
        this.logger.error(parseJSONError(error));
      }
      throw new InternalServerErrorException(
        "Error while downloading the file.",
      );
    }
  }

  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data.
   * @returns student profile details.
   */
  async getStudentProfile(studentId: number): Promise<StudentProfileAPIOutDTO>;
  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data.
   * @param options options:
   * - `withSensitiveData` boolean option to return sensitive data such as SIN.
   * @returns student profile details.
   */
  async getStudentProfile(
    studentId: number,
    options: { withSensitiveData: boolean },
  ): Promise<InstitutionStudentProfileAPIOutDTO>;
  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data.
   * @param options options:
   * - `withSensitiveData` boolean option to return sensitive data such as SIN.
   * - `withAdditionalSpecificData` boolean option to return additional specific data.
   * @returns student profile details.
   */
  async getStudentProfile(
    studentId: number,
    options: {
      withSensitiveData: boolean;
      withAdditionalSpecificData: boolean;
    },
  ): Promise<AESTStudentProfileAPIOutDTO>;
  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data.
   * @param options options:
   * - `withSensitiveData` boolean option to return sensitive data such as SIN.
   * - `withAdditionalSpecificData` boolean option to return additional specific data.
   * @returns student profile details.
   */
  async getStudentProfile(
    studentId: number,
    options?: {
      withSensitiveData: boolean;
      withAdditionalSpecificData: boolean;
    },
  ): Promise<
    | StudentProfileAPIOutDTO
    | InstitutionStudentProfileAPIOutDTO
    | AESTStudentProfileAPIOutDTO
  > {
    const student = await this.studentService.getStudentById(studentId, {
      includeLegacy: !!options?.withAdditionalSpecificData,
    });
    if (!student) {
      throw new NotFoundException("Student not found.");
    }
    const address = student.contactInfo.address ?? ({} as AddressInfo);
    const studentProfile = {
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      fullName: getUserFullName(student.user),
      email: student.user.email,
      gender: student.gender,
      dateOfBirth: getISODateOnlyString(student.birthDate),
      contact: {
        address: transformAddressDetailsForAddressBlockForm(address),
        phone: student.contactInfo.phone,
      },
      disabilityStatus: student.disabilityStatus,
      validSin: student.sinValidation.isValidSIN,
    };
    // Optionally load specific data for the Ministry.
    let legacyProfile: LegacyStudentProfileAPIOutDTO;
    let specificData: Pick<
      AESTStudentProfileAPIOutDTO,
      "hasRestriction" | "identityProviderType"
    >;
    if (options?.withAdditionalSpecificData) {
      const studentRestrictions =
        await this.studentRestrictionService.getStudentRestrictionsById(
          studentId,
          {
            onlyActive: true,
          },
        );
      specificData = {
        hasRestriction: !!studentRestrictions.length,
        identityProviderType: student.user
          .identityProviderType as SpecificIdentityProviders,
      };
      if (student.sfasIndividuals.length) {
        // Get the most recently updated profile.
        const [profile] = student.sfasIndividuals;
        legacyProfile = {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: profile.birthDate,
          sin: profile.sin,
          hasMultipleProfiles: student.sfasIndividuals.length > 1,
        };
      }
    }
    let sensitiveData: Pick<AESTStudentProfileAPIOutDTO, "sin">;
    if (options?.withSensitiveData) {
      sensitiveData = {
        sin: student.sinValidation.sin,
      };
    }
    return {
      ...studentProfile,
      ...specificData,
      ...sensitiveData,
      legacyProfile,
    };
  }

  /**
   * Get the student uploaded files.
   * @param studentId student id to retrieve the data.
   * @param options related to student file uploads
   * - `extendedDetails` option to specify the additional properties to be returned (metadata, groupName, updatedAt) as a part of the studentDocuments.
   * - `auditUserDetails` option to specify the additional properties to be returned (uploadedBy) as a part of the studentDocuments.
   * @returns student file details.
   */
  async getStudentUploadedFiles(
    studentId: number,
    options?: { extendedDetails: boolean; auditUserDetails?: boolean },
  ): Promise<
    | StudentFileDetailsAPIOutDTO[]
    | StudentUploadFileAPIOutDTO[]
    | AESTStudentFileDetailsAPIOutDTO[]
  > {
    const studentDocuments = await this.fileService.getStudentUploadedFiles(
      studentId,
    );
    return studentDocuments.map((studentDocument) => ({
      fileName: studentDocument.fileName,
      uniqueFileName: studentDocument.uniqueFileName,
      fileOrigin: studentDocument.fileOrigin,
      metadata: options?.extendedDetails ? studentDocument.metadata : undefined,
      groupName: options?.extendedDetails
        ? studentDocument.groupName
        : undefined,
      createdAt: options?.extendedDetails
        ? studentDocument.createdAt
        : undefined,
      uploadedBy: options?.auditUserDetails
        ? getUserFullName(studentDocument.creator)
        : undefined,
    }));
  }

  /**
   * Get all the applications that belong to student.
   * This API will be used by students.
   * @param studentId student id to retrieve the application summary.
   * @param pagination options to execute the pagination.
   * @param institutionId id of the institution that the student applied to.
   * @returns student application list with total count.
   */
  async getStudentApplicationSummary(
    studentId: number,
    pagination: ApplicationPaginationOptionsAPIInDTO,
    institutionId?: number,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>> {
    const [applications, count] =
      await this.applicationService.getAllStudentApplications(
        studentId,
        pagination,
        institutionId,
      );

    return {
      results: applications.map((application: Application) =>
        this.transformToApplicationSummaryDTO(application),
      ),
      count,
    };
  }

  /**
   * Util to transform application entity model to the expected DTO.
   * @param application application to be converted to a DTO.
   * @returns application DTO in a summary format.
   */
  private transformToApplicationSummaryDTO = (
    application: Application,
  ): ApplicationSummaryAPIOutDTO => {
    const offering = application.currentAssessment?.offering;
    return {
      id: application.id,
      applicationNumber: application.applicationNumber,
      isArchived: application.isArchived,
      studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
      studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
      status: application.applicationStatus,
      parentApplicationId: application.parentApplication.id,
      submittedDate: application.parentApplication.submittedDate,
      isChangeRequestAllowedForPY: allowApplicationChangeRequest(
        application.programYear,
      ),
    };
  };

  /**
   * Transforms a list of students into a list of student search details.
   * @param students list of students.
   * @returns a list of student search details.
   */
  transformStudentsToSearchStudentDetails(
    students: Student[],
  ): SearchStudentAPIOutDTO[] {
    return students.map((eachStudent: Student) => ({
      id: eachStudent.id,
      firstName: eachStudent.user.firstName,
      lastName: eachStudent.user.lastName,
      birthDate: getISODateOnlyString(eachStudent.birthDate),
      sin: eachStudent.sinValidation.sin,
    }));
  }

  /**
   * Validate the conditions to allow the student to be associated with a legacy profile.
   * @param studentId student ID to have a legacy profile associated with.
   * @returns possible legacy profiles that matches the student data.
   */
  async validateAndGetStudentLegacyMatches(
    studentId: number,
  ): Promise<SFASIndividual[]> {
    const student = await this.studentService.getStudentById(studentId, {
      includeLegacy: true,
    });
    if (!student) {
      throw new NotFoundException("Student not found.");
    }
    if (student.sfasIndividuals.length) {
      throw new UnprocessableEntityException(
        "Student already has a legacy profile associated.",
      );
    }
    return this.sfasIndividualService.getIndividualStudentPartialMatchForAssociation(
      student.user.lastName,
      student.birthDate,
      student.sinValidation.sin,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
