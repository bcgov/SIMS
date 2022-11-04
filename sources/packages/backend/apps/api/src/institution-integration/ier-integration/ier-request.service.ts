import { Injectable } from "@nestjs/common";
import { StudentAssessment } from "@sims/sims-db";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { ConfigService, StudentAssessmentService } from "../../services";
import { IERIntegrationConfig } from "../../types";
import { getFileNameAsCurrentTimestamp } from "../../utilities";
import { IERIntegrationService } from "./ier-integration.service";
import { IERRecord, IERUploadResult } from "./models/ier-integration.model";

@Injectable()
export class IERRequestService {
  ierIntegrationConfig: IERIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly ierIntegrationService: IERIntegrationService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    this.ierIntegrationConfig = config.getConfig().IERIntegrationConfig;
  }

  /**
   * 1. Fetches the assessment data for the institution location.
   * 2. Create the Request content for the IER 12 file by populating the
   * header, footer and trailer content.
   * 3. Create the request filename with the file path with respect to the institution code
   * for the IER 12 Request sent File.
   * 4. Upload the content to the zoneB SFTP server.
   * @param generatedDate date in which the assessment for
   * particular institution is generated.
   * @returns Processing IER 12 request result.
   */
  async processIER12Request(generatedDate?: Date): Promise<IERUploadResult[]> {
    this.logger.log(
      `Retrieving pending assessment on ${generatedDate} for IER 12 request...`,
    );
    const pendingAssessments =
      await this.studentAssessmentService.getPendingAssessment(generatedDate);
    if (!pendingAssessments.length) {
      return [
        {
          generatedFile: "none",
          uploadedRecords: 0,
        },
      ];
    }
    this.logger.log(`Found ${pendingAssessments.length} assessments.`);
    const fileRecords: Record<string, IERRecord[]> = {};
    pendingAssessments.forEach((pendingAssessment) => {
      const institutionCode =
        pendingAssessment.offering.institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      fileRecords[institutionCode].push(
        this.createIERRecord(pendingAssessment),
      );
    });
    //Create records and create the unique file sequence number
    const uploadResult: IERUploadResult[] = [];
    try {
      this.logger.log("Creating IER request content...");
      Object.keys(fileRecords).forEach(async (institutionCode) => {
        // Create the Request content for the IER file by populating the content.
        const fileContent = this.ierIntegrationService.createIERRequestContent(
          fileRecords[institutionCode],
        );
        // Create the request filename with the file path for the each and every institutionCode.
        const fileInfo = this.createRequestFileName(institutionCode);
        this.logger.log("Uploading content...");
        uploadResult.push(
          await this.ierIntegrationService.uploadContent(
            fileContent,
            fileInfo.filePath,
          ),
        );
      });
    } catch (error) {
      this.logger.error(
        `Error while uploading content for IER Request: ${error}`,
      );
      throw error;
    }
    return uploadResult;
  }

  /**
   * Create file name IER records file.
   * @param reportName Report name to be a part of filename.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  createRequestFileName(institutionCode: string): {
    fileName: string;
    filePath: string;
  } {
    const timestamp = getFileNameAsCurrentTimestamp();
    const fileName = `IER_012_${timestamp}.txt`;
    const filePath = `${this.ierIntegrationConfig.ftpRequestFolder}\\${institutionCode}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }
  private createIERRecord(pendingAssessment: StudentAssessment): IERRecord {
    const application = pendingAssessment.application;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = pendingAssessment.offering;
    const educationProgram = offering.educationProgram;
    return {
      assessmentId: pendingAssessment.id,
      applicationNumber: application.applicationNumber,
      sin: sinValidation.sin,
      studentLastName: user.lastName,
      studentGivenName: user.firstName,
      birthDate: student.birthDate,
      programName: educationProgram.name,
      programDescription: educationProgram.description,
      credentialType: educationProgram.credentialType,
      cipCode: parseFloat(educationProgram.cipCode) * 10000,
      nocCode: educationProgram.nocCode,
      sabcCode: educationProgram.sabcCode,
      institutionProgramCode: educationProgram.institutionProgramCode,
      programLength: offering.yearOfStudy,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      tuitionFees: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionExpenses: offering.exceptionalExpenses,
      totalFundedWeeks: offering.studyBreaks.totalFundedWeeks,
      // As this implementation is only for FT,
      // we have hardcoded the courseLoad to 100 and offering Intensity to F.
      courseLoad: null,
      offeringIntensity: "F",
      disbursementSchedules: pendingAssessment.disbursementSchedules,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
