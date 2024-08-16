import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Application } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Consists of all application services which are specific to the integration.
 */
@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async getDateChangeNotReportedApplication(): Promise<any> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select("application.applicationNumber", "Application Number")
        .addSelect("sinValidation.sin", "Student SIN")
        .addSelect("user.firstName", "Student First Name")
        .addSelect("user.lastName", "Student Last Name")
        // .addSelect("", "Loan Type")
        // .addSelect("", "Education Institution Code")
        // .addSelect("", "Original Study Start Date")
        // .addSelect("", "Original Study End Date")
        // .addSelect("", "Activity")
        // .addSelect("", "Activity Time")
        // .addSelect("", "New Study Start Date")
        // .addSelect("", "New Study End Date")
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
        .where("currentAssessment.reportedDate IS NOT NULL")
        .getRawAndEntities()
    );
  }
}
