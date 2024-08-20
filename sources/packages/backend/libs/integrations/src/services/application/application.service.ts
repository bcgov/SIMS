import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import {
  Application,
  OfferingIntensity,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { DATE_ONLY_ISO_FORMAT, PST_TIMEZONE } from "@sims/utilities";
import { ApplicationChangesReport } from "./models/application.model";

const ISO_DATE_TIME_FORMAT = 'YYYY-MM-DD"T"HH24:mm:ss';

/**
 * Consists of all application services which are specific to the integration.
 */
@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async getDateChangeNotReportedApplications(): Promise<
    ApplicationChangesReport[]
  > {
    const sql = this.applicationRepo
      .createQueryBuilder("application")
      .select("application.applicationNumber", "Application Number")
      .addSelect("sinValidation.sin", "Student SIN")
      .addSelect("user.firstName", "Student First Name")
      .addSelect("user.lastName", "Student Last Name")
      .addSelect(
        `CASE WHEN currentOffering.offeringIntensity = '${OfferingIntensity.fullTime}' 
         THEN 'FT' ELSE 'PT' END`,
        "Loan Type",
      )
      .addSelect(
        "institutionLocation.institutionCode",
        "Education Institution Code",
      )
      .addSelect(
        `TO_CHAR(previousOffering.studyStartDate, '${DATE_ONLY_ISO_FORMAT}')`,
        "Original Study Start Date",
      )
      .addSelect(
        `TO_CHAR(previousOffering.studyEndDate, '${DATE_ONLY_ISO_FORMAT}')`,
        "Original Study End Date",
      )
      .addSelect(
        `CASE WHEN studentScholasticStanding.changeType IS NOT NULL AND studentScholasticStanding.changeType = '${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}'
         THEN 'Early Withdrawal' ELSE 'Reassessment' END`,
        "Activity",
      )
      .addSelect(
        `TO_CHAR((currentAssessment.createdAt AT TIME ZONE '${PST_TIMEZONE}'), '${ISO_DATE_TIME_FORMAT}')`,
        "Activity Time",
      )
      .addSelect(
        `TO_CHAR(currentOffering.studyStartDate, '${DATE_ONLY_ISO_FORMAT}')`,
        "New Study Start Date",
      )
      .addSelect(
        `TO_CHAR(currentOffering.studyEndDate, '${DATE_ONLY_ISO_FORMAT}')`,
        "New Study End Date",
      )
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin(
        "currentAssessment.previousDateChangedReportedAssessment",
        "previousDateChangedReportedAssessment",
      )
      .leftJoin(
        "currentAssessment.studentScholasticStanding",
        "studentScholasticStanding",
      )
      .innerJoin("currentAssessment.offering", "currentOffering")
      .innerJoin(
        "previousDateChangedReportedAssessment.offering",
        "previousOffering",
      )
      .innerJoin("currentOffering.institutionLocation", "institutionLocation")
      .where("currentAssessment.reportedDate IS NULL");
    console.log(sql.getSql());
    return sql.getRawMany<ApplicationChangesReport>();
  }
}
