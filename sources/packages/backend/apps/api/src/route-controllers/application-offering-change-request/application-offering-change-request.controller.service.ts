import { Injectable } from "@nestjs/common";
import { ApplicationOfferingChangeRequest } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { getUserFullName } from "../../utilities";
import { PaginatedResultsAPIOutDTO } from "../models/pagination.dto";
import { InProgressApplicationOfferingChangesAPIOutDTO } from "./models/application-offering-change-request.institutions.dto";

@Injectable()
export class ApplicationOfferingChangeRequestControllerService {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
  ) {}
  /**
   * Map paginated results to a list of objects to be transferred by the API.
   * @param offeringChange offering change paginated results.
   * @returns list of objects to be transferred by the API.
   */
  mapToInProgressApplicationOfferingChangesAPIOutDTOs(
    offeringChange: PaginatedResultsAPIOutDTO<ApplicationOfferingChangeRequest>,
  ): InProgressApplicationOfferingChangesAPIOutDTO[] {
    return offeringChange.results.map((eachOfferingChange) => {
      const offering =
        eachOfferingChange.application.currentAssessment.offering;
      return {
        id: eachOfferingChange.id,
        applicationNumber: eachOfferingChange.application.applicationNumber,
        applicationId: eachOfferingChange.application.id,
        studyStartDate: offering.studyStartDate,
        studyEndDate: offering.studyEndDate,
        fullName: getUserFullName(eachOfferingChange.application.student.user),
        status: eachOfferingChange.applicationOfferingChangeRequestStatus,
        createdAt: getISODateOnlyString(eachOfferingChange.createdAt),
        studentId: eachOfferingChange.application.student.id,
      };
    });
  }
}
