import { Injectable, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import {
  ApplicationService,
  StudentFileService,
  StudentService,
} from "../../services";
import { Readable } from "stream";
import { FileCreateAPIOutDTO } from "../models/common.dto";
import {
  ApplicationPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  determinePDStatus,
  getISODateOnlyString,
  getUserFullName,
} from "../../utilities";
import { AddressInfo, Application } from "src/database/entities";
import {
  ApplicationSummaryAPIOutDTO,
  StudentProfileAPIOutDTO,
} from "./models/student.dto";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";

@Injectable()
export class StudentControllerService {
  constructor(
    private readonly fileService: StudentFileService,
    private readonly studentService: StudentService,
    private readonly applicationService: ApplicationService,
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
    const createdFile = await this.fileService.createFile(
      {
        fileName: file.originalname,
        uniqueFileName: uniqueFileName,
        groupName: groupName,
        mimeType: file.mimetype,
        fileContent: file.buffer,
      },
      studentId,
      auditUserId,
    );

    return {
      fileName: createdFile.fileName,
      uniqueFileName: createdFile.uniqueFileName,
      url: `students/files/${createdFile.uniqueFileName}`,
      size: createdFile.fileContent.length,
      mimetype: createdFile.mimeType,
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

    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${studentFile.fileName}`,
    );
    response.setHeader("Content-Type", studentFile.mimeType);
    response.setHeader("Content-Length", studentFile.fileContent.length);

    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);

    stream.pipe(response);
  }

  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data.
   * @returns student profile information or null case not found.
   */
  async getStudentProfile(studentId: number): Promise<StudentProfileAPIOutDTO> {
    const student = await this.studentService.getStudentById(studentId);
    if (!student) {
      return;
    }

    const address = student.contactInfo.address ?? ({} as AddressInfo);
    return {
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
      pdStatus: determinePDStatus(student),
      validSin: student.sinValidation.isValidSIN,
    };
  }

  /**
   * Get all the applications that belong to student.
   * This API will be used by students.
   * @param studentId student id to retrieve the application summary.
   * @param pagination options to execute the pagination.
   * @returns student application list with total count.
   */
  async getStudentApplicationSummary(
    studentId: number,
    pagination: ApplicationPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>> {
    const [applications, count] =
      await this.applicationService.getAllStudentApplications(
        studentId,
        pagination,
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
      studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
      studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
      // TODO: when application name is captured, update the below line
      applicationName: "Financial Aid Application",
      submitted: application.currentAssessment?.submittedDate,
      status: application.applicationStatus,
    };
  };
}
