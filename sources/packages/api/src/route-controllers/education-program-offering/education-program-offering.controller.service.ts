import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
} from "../../database/entities";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  SaveOfferingModel,
} from "../../services";
import {
  getISODateOnlyString,
  getOfferingNameAndPeriod,
} from "../../utilities";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  OfferingsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
} from "./models/education-program-offering.dto";

@Injectable()
export class EducationProgramOfferingControllerService {
  constructor(
    private readonly offeringService: EducationProgramOfferingService,
    private readonly programService: EducationProgramService,
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

  /**
   * Get offerings for the given program and location
   * in client lookup format.
   * @param locationId offering location.
   * @param programId offering program.
   * @param programYearId program year of the offering program.
   * @param offeringTypes offering types to be filtered.
   * @param offeringIntensity offering intensity.
   * @param includeInActivePY if includeInActivePY is true/supplied then both active
   * and not active program year are considered.
   * @returns offerings in client lookup format.
   */
  async getProgramOfferingsOptionsList(
    locationId: number,
    programId: number,
    programYearId: number,
    offeringTypes: OfferingTypes[],
    includeInActivePY: boolean,
    offeringIntensity?: OfferingIntensity,
  ): Promise<OptionItemAPIOutDTO[]> {
    if (
      offeringIntensity &&
      !Object.values(OfferingIntensity).includes(offeringIntensity)
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    const offeringsFilter = {
      offeringIntensity,
      offeringStatus: OfferingStatus.Approved,
      offeringTypes,
    };
    const offerings = await this.offeringService.getProgramOfferingsForLocation(
      locationId,
      programId,
      programYearId,
      offeringsFilter,
      includeInActivePY,
    );
    return offerings.map((offering) => ({
      id: offering.id,
      description: getOfferingNameAndPeriod(offering),
    }));
  }

  async getSaveOfferingModelFromOfferingAPIInDTO(
    institutionId: number,
    locationId: number,
    programId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<SaveOfferingModel> {
    const program = await this.programService.getEducationProgramDetails(
      programId,
      institutionId,
    );
    if (!program) {
      throw new NotFoundException(
        "Program to create the offering not found for the institution.",
      );
    }
    return {
      ...payload,
      locationId,
      studyBreaks: payload.breaksAndWeeks?.studyBreaks,
      programContext: program,
    };
  }
}
