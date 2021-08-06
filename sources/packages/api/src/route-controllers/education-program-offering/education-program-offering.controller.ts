import {
  Body,
  Controller,
  Post,
  Patch,
  Param,
  Get,
  UnprocessableEntityException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import {
  SaveEducationProgramOfferingDto,
  EducationProgramOfferingDto,
  ProgramOfferingDto,
} from "./models/education-program-offering.dto";
import { FormNames } from "../../services/form/constants";
import {
  EducationProgramOfferingService,
  FormService,
  InstitutionLocationService,
  EducationProgramService,
} from "../../services";
import { OptionItem } from "../../types";
import { IInstitutionUserToken } from "../../auth/userToken.interface";

@Controller("institution/offering")
export class EducationProgramOfferingController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly locationService: InstitutionLocationService,
    private readonly programService: EducationProgramService,
  ) {}

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Post("location/:locationId/education-program/:programId")
  async create(
    @Body() payload: SaveEducationProgramOfferingDto,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (
      userToken.authorizations.institutionId !== requestedLoc.institution.id
    ) {
      throw new ForbiddenException();
    }
    const requestProgram = await this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );
    if (!requestProgram) {
      throw new NotFoundException();
    }
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a create a program offering due to an invalid request.",
      );
    }

    const createdProgramOffering =
      await this.programOfferingService.createEducationProgramOffering(
        locationId,
        programId,
        payload,
      );
    return createdProgramOffering.id;
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId")
  async getAllEducationProgramOffering(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramOfferingDto[]> {
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (
      userToken.authorizations.institutionId !== requestedLoc.institution.id
    ) {
      throw new ForbiddenException();
    }
    //To retrive Education program offering corresponding to ProgramId and LocationId
    const programOferingList =
      await this.programOfferingService.getAllEducationProgramOffering(
        locationId,
        programId,
      );
    if (!programOferingList) {
      throw new UnprocessableEntityException(
        "Not able to find a Education Program Offering associated with the current Education Program and Location.",
      );
    }
    return programOferingList.map((offering) => ({
      id: offering.id,
      name: offering.name,
      studyDates: offering.studyDates,
      offeringDelivered: offering.offeringDelivered,
      offeredType: offering.offeredType,
    }));
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId/offering/:offeringId")
  async getProgramOffering(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Param("offeringId") offeringId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<ProgramOfferingDto> {
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (
      userToken.authorizations.institutionId !== requestedLoc.institution.id
    ) {
      throw new ForbiddenException();
    }
    //To retrive Education program offering corresponding to ProgramId and LocationId
    const offering = await this.programOfferingService.getProgramOffering(
      locationId,
      programId,
      offeringId,
    );
    if (!offering) {
      throw new UnprocessableEntityException(
        "Not able to find a Education Program Offering associated with the current Education Program, Location and offering.",
      );
    }
    return {
      id: offering.id,
      name: offering.name,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      breakStartDate: offering.breakStartDate,
      breakEndDate: offering.breakEndDate,
      actualTuitionCosts: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionalExpenses: offering.exceptionalExpenses,
      tuitionRemittanceRequestedAmount:
        offering.tuitionRemittanceRequestedAmount,
      offeringDelivered: offering.offeringDelivered,
      lacksStudyDates: offering.lacksStudyDates,
      lacksStudyBreaks: offering.lacksStudyBreaks,
      lacksFixedCosts: offering.lacksFixedCosts,
      tuitionRemittanceRequested: offering.tuitionRemittanceRequested,
      offeredType: offering.offeredType,
    };
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Patch(
    "location/:locationId/education-program/:programId/offering/:offeringId",
  )
  async updateProgramOffering(
    @Body() payload: SaveEducationProgramOfferingDto,
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId") locationId: number,
    @Param("programId") programId?: number,
    @Param("offeringId") offeringId?: number,
  ): Promise<number> {
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (
      userToken.authorizations.institutionId !== requestedLoc.institution.id
    ) {
      throw new ForbiddenException();
    }
    const requestOffering =
      await this.programOfferingService.getProgramOffering(
        locationId,
        programId,
        offeringId,
      );
    if (!requestOffering) {
      throw new ForbiddenException();
    }
    const requestProgram = await this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );
    if (!requestProgram) {
      throw new ForbiddenException();
    }
    const updatingResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!updatingResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a update a program offering due to an invalid request.",
      );
    }

    const updateProgramOffering =
      await this.programOfferingService.updateEducationProgramOffering(
        locationId,
        programId,
        offeringId,
        payload,
      );
    return updateProgramOffering.affected;
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("location/:locationId/education-program/:programId/options-list")
  async getProgramOfferingsForLocation(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
  ): Promise<OptionItem[]> {
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
      );

    return offerings.map((offering) => ({
      id: offering.id,
      description: offering.name,
    }));
  }
}
