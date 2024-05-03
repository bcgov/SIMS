import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  FormService,
} from "../../services";
import { EducationProgram, OfferingTypes } from "@sims/sims-db";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import {
  EducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  EducationProgramAPIInDTO,
} from "./models/education-program.dto";
import { credentialTypeToDisplay, getUserFullName } from "../../utilities";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import { FormNames } from "../../services/form/constants";
import {
  EDUCATION_PROGRAM_NOT_FOUND,
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_INVALID_OPERATION,
} from "../../constants";
import { ApiProcessError } from "../../types";
import { SaveEducationProgram } from "../../services/education-program/education-program.service.models";
import { InstitutionService } from "../../services/institution/institution.service";

@Injectable()
export class EducationProgramControllerService {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly institutionService: InstitutionService,
  ) {}

  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on locations.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options.
   * @param locationId optional location id to filter.
   * @returns paginated summary for the institution or location.
   */
  async getProgramsSummary(
    institutionId: number,
    paginationOptions: ProgramsPaginationOptionsAPIInDTO,
    locationId?: number,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    const programs = await this.programService.getProgramsSummary(
      institutionId,
      [OfferingTypes.Public, OfferingTypes.Private],
      paginationOptions,
      locationId,
    );

    return {
      results: programs.results.map((program) => ({
        programId: program.programId,
        programName: program.programName,
        cipCode: program.cipCode,
        credentialType: program.credentialType,
        totalOfferings: program.totalOfferings,
        submittedDate: program.submittedDate,
        locationId: program.locationId,
        locationName: program.locationName,
        programStatus: program.programStatus,
        isActive: program.isActive,
        credentialTypeToDisplay: credentialTypeToDisplay(
          program.credentialType,
        ),
      })),
      count: programs.count,
    };
  }

  /**
   * Saves an education program (insert/update).
   * @param payload payload with data to be persisted.
   * @param institutionId institution to have the program inserted or updated.
   * @param programId if provided, will update the record, otherwise will insert a new one.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns inserted/updated program.
   */
  async saveProgram(
    payload: EducationProgramAPIInDTO,
    institutionId: number,
    auditUserId: number,
    programId?: number,
  ): Promise<EducationProgram> {
    // Check if institution is private/public and append it to the payload.
    const { institutionType } =
      await this.institutionService.getInstitutionTypeById(institutionId);
    payload.isBCPrivate = institutionType.isBCPrivate;
    payload.isBCPublic = institutionType.isBCPublic;

    const submissionResult =
      await this.formService.dryRunSubmission<SaveEducationProgram>(
        FormNames.EducationProgram,
        payload,
      );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a save the program due to an invalid request.",
      );
    }

    try {
      // The payload returned from form.io contains the approvalStatus as
      // a calculated server value. If the approvalStatus value is sent
      // from the client form it will be overridden by the server calculated one.
      return await this.programService.saveEducationProgram(
        institutionId,
        auditUserId,
        submissionResult.data.data,
        programId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case EDUCATION_PROGRAM_NOT_FOUND:
            throw new NotFoundException(error.message);
          case EDUCATION_PROGRAM_INVALID_OPERATION:
            throw new UnprocessableEntityException(error.message);
          case DUPLICATE_SABC_CODE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Education program information shared between the Ministry and the Institution.
   * @param programId program id.
   * @param institutionId when provided, ensures the proper authorization
   * checking if the institution has access to the program.
   * @returns programs information.
   * */
  async getEducationProgram(
    programId: number,
    institutionId?: number,
  ): Promise<EducationProgramAPIOutDTO> {
    const programPromise = this.programService.getEducationProgramDetails(
      programId,
      institutionId,
    );
    const hasOfferingsPromise =
      this.educationProgramOfferingService.hasExistingOffering(programId);
    // Wait for the program and for the offering check to be retrieved.
    const [program, hasOfferings] = await Promise.all([
      programPromise,
      hasOfferingsPromise,
    ]);

    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    return {
      id: program.id,
      programStatus: program.programStatus,
      name: program.name,
      description: program.description,
      credentialType: program.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(program.credentialType),
      cipCode: program.cipCode,
      nocCode: program.nocCode,
      sabcCode: program.sabcCode,
      regulatoryBody: program.regulatoryBody,
      otherRegulatoryBody: program.otherRegulatoryBody,
      programDeliveryTypes: {
        deliveredOnSite: program.deliveredOnSite,
        deliveredOnline: program.deliveredOnline,
      },
      deliveredOnlineAlsoOnsite: program.deliveredOnlineAlsoOnsite,
      sameOnlineCreditsEarned: program.sameOnlineCreditsEarned,
      earnAcademicCreditsOtherInstitution:
        program.earnAcademicCreditsOtherInstitution,
      courseLoadCalculation: program.courseLoadCalculation,
      completionYears: program.completionYears,
      eslEligibility: program.eslEligibility,
      hasJointInstitution: program.hasJointInstitution,
      hasJointDesignatedInstitution: program.hasJointDesignatedInstitution,
      programIntensity: program.programIntensity,
      institutionProgramCode: program.institutionProgramCode,
      minHoursWeek: program.minHoursWeek,
      isAviationProgram: program.isAviationProgram,
      minHoursWeekAvi: program.minHoursWeekAvi,
      entranceRequirements: {
        hasMinimumAge: program.hasMinimumAge,
        minHighSchool: program.minHighSchool,
        requirementsByInstitution: program.requirementsByInstitution,
        requirementsByBCITA: program.requirementsByBCITA,
        noneOfTheAboveEntranceRequirements:
          program.noneOfTheAboveEntranceRequirements,
      },
      hasWILComponent: program.hasWILComponent,
      isWILApproved: program.isWILApproved,
      wilProgramEligibility: program.wilProgramEligibility,
      hasTravel: program.hasTravel,
      travelProgramEligibility: program.travelProgramEligibility,
      hasIntlExchange: program.hasIntlExchange,
      intlExchangeProgramEligibility: program.intlExchangeProgramEligibility,
      programDeclaration: program.programDeclaration,
      institutionId: program.institution.id,
      institutionName: program.institution.operatingName,
      submittedDate: program.submittedDate,
      submittedBy: getUserFullName(program.submittedBy),
      effectiveEndDate: getISODateOnlyString(program.effectiveEndDate),
      assessedDate: program.assessedDate,
      assessedBy: getUserFullName(program.assessedBy),
      isBCPublic: program.institution.institutionType.isBCPublic,
      isBCPrivate: program.institution.institutionType.isBCPrivate,
      hasOfferings,
      isActive: program.isActive,
    };
  }

  /**
   * Allows a program to be deactivated by an Institution.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `institutionId` institution used for authorization.
   */
  async deactivateProgram(
    programId: number,
    auditUserId: number,
    options: {
      institutionId: number;
    },
  ): Promise<void>;
  /**
   * Allows a program to be deactivated by the Ministry providing additional notes.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `notes` notes associated with the change.
   */
  async deactivateProgram(
    programId: number,
    auditUserId: number,
    options: {
      notes: string;
    },
  ): Promise<void>;
  /**
   * Allows a program to be deactivated.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `institutionId` institution used for authorization.
   * - `notes` notes associated with the change.
   */
  async deactivateProgram(
    programId: number,
    auditUserId: number,
    options?: {
      institutionId?: number;
      notes?: string;
    },
  ): Promise<void> {
    try {
      await this.programService.updateEducationProgramIsActive(
        programId,
        auditUserId,
        false,
        options,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === EDUCATION_PROGRAM_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
        if (error.name === EDUCATION_PROGRAM_INVALID_OPERATION) {
          throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
