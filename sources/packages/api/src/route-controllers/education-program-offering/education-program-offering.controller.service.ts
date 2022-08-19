import { Injectable } from "@nestjs/common";
import { OfferingTypes } from "../../database/entities";
import { EducationProgramOfferingService } from "../../services";
import { getISODateOnlyString } from "../../utilities";
import {
  OfferingsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { EducationProgramOfferingSummaryAPIOutDTO } from "./models/education-program-offering.dto";

@Injectable()
export class EducationProgramOfferingControllerService {
  constructor(
    private readonly offeringService: EducationProgramOfferingService,
  ) {}

  /**
   * Get summary of offerings for a program and location.
   * Pagination, sort and search are available on results.
   * @param locationId offering location.
   * @param programId offering program.
   * @param paginationOptions pagination options.
   * @returns offering summary results.
   */
  async getOfferingsSummary(
    locationId: number,
    programId: number,
    paginationOptions: OfferingsPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<EducationProgramOfferingSummaryAPIOutDTO>
  > {
    // To retrieve Education program offering corresponding to ProgramId and LocationId
    // [OfferingTypes.Private] offerings are
    // created during PIR, if required, and they are supposed
    // to be viewed only associated to the application that they
    // were associated to during the PIR, hence they should not
    // be displayed alongside with the public offerings.
    const offerings = await this.offeringService.getAllEducationProgramOffering(
      locationId,
      programId,
      paginationOptions,
      [OfferingTypes.Public, OfferingTypes.Private],
    );

    return {
      results: offerings.results.map((offering) => ({
        id: offering.id,
        name: offering.name,
        studyStartDate: getISODateOnlyString(offering.studyStartDate),
        studyEndDate: getISODateOnlyString(offering.studyEndDate),
        offeringDelivered: offering.offeringDelivered,
        offeringIntensity: offering.offeringIntensity,
        offeringType: offering.offeringType,
        offeringStatus: offering.offeringStatus,
      })),
      count: offerings.count,
    };
  }
}
