import { Injectable } from "@nestjs/common";
import { IsNull, Not, Repository } from "typeorm";
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

  async getDateChangeNotReportedApplications(): Promise<Application[]> {
    return this.applicationRepo.find({
      select: {
        id: true,
        applicationNumber: true,
        student: {
          id: true,
          sinValidation: { id: true, sin: true },
          user: { id: true, firstName: true, lastName: true },
        },
        currentAssessment: {
          id: true,
          createdAt: true,
          offering: {
            id: true,
            studyStartDate: true,
            studyEndDate: true,
            offeringIntensity: true,
            institutionLocation: { id: true, institutionCode: true },
          },
          previousDateChangedReportedAssessment: {
            id: true,
            offering: { id: true, studyStartDate: true, studyEndDate: true },
          },
          studentScholasticStanding: { id: true, changeType: true },
        },
      },
      relations: {
        student: { sinValidation: true, user: true },
        currentAssessment: {
          offering: { institutionLocation: true },
          previousDateChangedReportedAssessment: { offering: true },
          studentScholasticStanding: true,
        },
      },
      where: {
        currentAssessment: {
          previousDateChangedReportedAssessment: { id: Not(IsNull()) },
          reportedDate: IsNull(),
        },
      },
    });
  }
}
