import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InstitutionService, FormService } from "../../services";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  getExtendedDateFormat,
} from "../../utilities";
import {
  InstitutionReadOnlyDTO,
  InstitutionContactDTO,
  InstitutionProfileDTO,
} from "./models/institution.dto";
import { FormNames } from "../../services/form/constants";

/**
 * Service/Provider for Institutions controller to wrap the common methods.
 */
@Injectable()
export class InstitutionControllerService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly formService: FormService,
  ) {}

  /**
   * Get institution detail.
   * @param institutionId
   * @param clientType
   * @returns InstitutionReadOnlyDTO
   */
  async getInstitutionDetail(
    institutionId: number,
  ): Promise<InstitutionReadOnlyDTO> {
    const institutionDetail =
      await this.institutionService.getInstitutionDetailById(institutionId);

    if (!institutionDetail) {
      throw new NotFoundException("Institution not valid");
    }
    const isBCPrivate =
      INSTITUTION_TYPE_BC_PRIVATE === institutionDetail.institutionType.id;
    return {
      legalOperatingName: institutionDetail.legalOperatingName,
      operatingName: institutionDetail.operatingName,
      primaryPhone: institutionDetail.primaryPhone,
      primaryEmail: institutionDetail.primaryEmail,
      website: institutionDetail.website,
      regulatingBody: institutionDetail.regulatingBody,
      institutionType: institutionDetail.institutionType.id,
      institutionTypeName: institutionDetail.institutionType.name,
      establishedDate: institutionDetail.establishedDate,
      formattedEstablishedDate: getExtendedDateFormat(
        institutionDetail.establishedDate,
      ),
      primaryContactEmail:
        institutionDetail.institutionPrimaryContact.primaryContactEmail,
      primaryContactFirstName:
        institutionDetail.institutionPrimaryContact.primaryContactFirstName,
      primaryContactLastName:
        institutionDetail.institutionPrimaryContact.primaryContactLastName,
      primaryContactPhone:
        institutionDetail.institutionPrimaryContact.primaryContactPhone,
      mailingAddress: {
        addressLine1: institutionDetail.institutionAddress.addressLine1,
        addressLine2: institutionDetail.institutionAddress.addressLine2,
        city: institutionDetail.institutionAddress.city,
        country: institutionDetail.institutionAddress.country,
        provinceState: institutionDetail.institutionAddress.provinceState,
        postalCode: institutionDetail.institutionAddress.postalCode,
      },
      isBCPrivate: isBCPrivate,
    };
  }

  /**
   * Validate dry run submission.
   * @param payload form data to validate.
   */
  async validateDryRunSubmissionForUpdate(
    payload: InstitutionContactDTO | InstitutionProfileDTO,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.InstitutionProfile,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update institution due to an invalid request.",
      );
    }
  }
}
