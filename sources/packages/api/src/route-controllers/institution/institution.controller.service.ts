import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  BCeIDService,
  InstitutionService,
  LEGAL_SIGNING_AUTHORITY_EXIST,
  LEGAL_SIGNING_AUTHORITY_MSG,
} from "../../services";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  getExtendedDateFormat,
  transformToInstitutionUserRespDto,
  PaginationOptions,
  PaginatedResults,
} from "../../utilities";
import { AddressInfo, InstitutionUser } from "../../database/entities";
import { InstitutionDetailAPIOutDTO } from "./models/institution.dto";
import {
  CreateInstitutionUserAPIInDTO,
  InstitutionUserAPIOutDTO,
} from "./models/institution-user.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { BCeIDAccountTypeCodes } from "../../services/bceid/bceid.models";
import { InstitutionUserRoles } from "src/auth/user-types.enum";

/**
 * Service/Provider for Institutions controller to wrap the common methods.
 */
@Injectable()
export class InstitutionControllerService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly bceIDService: BCeIDService,
  ) {}

  /**
   * Get institution detail.
   * @param institutionId
   * @returns Institution details.
   */
  async getInstitutionDetail(
    institutionId: number,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const institutionDetail =
      await this.institutionService.getInstitutionDetailById(institutionId);

    if (!institutionDetail) {
      throw new NotFoundException("Institution not found.");
    }
    const isBCPrivate =
      INSTITUTION_TYPE_BC_PRIVATE === institutionDetail.institutionType.id;

    // {} as AddressInfo is added to prevent old data to break.
    const mailingAddress =
      institutionDetail.institutionAddress.mailingAddress ??
      ({} as AddressInfo);
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
      primaryContactEmail: institutionDetail.institutionPrimaryContact.email,
      primaryContactFirstName:
        institutionDetail.institutionPrimaryContact.firstName,
      primaryContactLastName:
        institutionDetail.institutionPrimaryContact.lastName,
      primaryContactPhone: institutionDetail.institutionPrimaryContact.phone,
      mailingAddress: {
        addressLine1: mailingAddress.addressLine1,
        addressLine2: mailingAddress.addressLine2,
        city: mailingAddress.city,
        country: mailingAddress.country,
        provinceState: mailingAddress.provinceState,
        postalCode: mailingAddress.postalCode,
        selectedCountry: mailingAddress.selectedCountry,
      },
      isBCPrivate: isBCPrivate,
      hasBusinessGuid: !!institutionDetail.businessGuid,
    };
  }

  /**
   * Get institution users with page, sort and search.
   * @param institutionId
   * @param paginationOptions
   * @returns Institution Users.
   */
  async getInstitutionUsers(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    const [institutionUsers, count] =
      await this.institutionService.getInstitutionUsers(
        institutionId,
        paginationOptions,
      );

    return {
      results: institutionUsers.map((eachInstitutionUser: InstitutionUser) => {
        return transformToInstitutionUserRespDto(eachInstitutionUser);
      }),
      count: count,
    };
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param institutionId institution to have the user associated.
   * @param payload user and authorization information.
   * @returns created user id.
   */
  async createInstitutionUserWithAuth(
    institutionId: number,
    payload: CreateInstitutionUserAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const institution =
      await this.institutionService.getBasicInstitutionDetailById(
        institutionId,
      );

    const accountType = institution.businessGuid
      ? BCeIDAccountTypeCodes.Business
      : BCeIDAccountTypeCodes.Individual;

    // Find user on BCeID Web Service
    const bceidUserAccount = await this.bceIDService.getAccountDetails(
      payload.userId,
      accountType,
    );
    if (!bceidUserAccount) {
      throw new UnprocessableEntityException(
        "User not found on BCeID Web Service.",
      );
    }
    // Check if the user being added to the institution belongs to the institution.
    // This check is only possible and needed for institutions that have a business guid associated wth.
    if (
      accountType === BCeIDAccountTypeCodes.Business &&
      institution.businessGuid.toLowerCase() !==
        bceidUserAccount.institution.guid.toLowerCase()
    ) {
      throw new UnprocessableEntityException(
        "User to be added not found under the institution.",
      );
    }

    // A legal signing authority role can be added to only one user per institution.
    const hasLegalSigningAuthorityToBeAdded = payload.permissions.some(
      (role) => role.userRole === InstitutionUserRoles.legalSigningAuthority,
    );

    if (hasLegalSigningAuthorityToBeAdded) {
      const legalSigningAuthority =
        await this.institutionService.checkLegalSigningAuthority(
          institution.id,
        );

      // TODO: throw a nice API error to be captured in Vue.
      if (legalSigningAuthority) {
        throw new UnprocessableEntityException(
          LEGAL_SIGNING_AUTHORITY_EXIST,
          LEGAL_SIGNING_AUTHORITY_MSG,
        );
      }
    }

    // Create the user and the related records.
    const createdInstitutionUser =
      await this.institutionService.createInstitutionUser(
        institution.id,
        bceidUserAccount,
        payload,
      );

    return { id: createdInstitutionUser.id };
  }
}
