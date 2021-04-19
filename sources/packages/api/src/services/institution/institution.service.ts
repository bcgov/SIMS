import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Institution, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import {
  CreateInstitutionDto,
  InstituteDto,
  InstitutionDetailDto,
} from "../../route-controllers/institution/models/institution.dto";
import { LoggerService } from "../../logger/logger.service";
import { BCeIDService } from "../bceid/bceid.service";
import { InjectLogger } from "../../common";
import { UserService } from "../user/user.service";

@Injectable()
export class InstitutionService extends RecordDataModelService<Institution> {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    @Inject("Connection") connection: Connection,
    private readonly bceidService: BCeIDService,
    private readonly userService: UserService,
  ) {
    super(connection.getRepository(Institution));
    this.logger.log("[Created]");
  }

  toDtoObject(institutionEntity: Institution): InstituteDto {
    return {
      operatingName: institutionEntity.operatingName,
      primaryPhone: institutionEntity.primaryPhone,
      primaryEmail: institutionEntity.primaryEmail,
      website: institutionEntity.website,
      regulatingBody: institutionEntity.regulatingBody,
      establishedDate: institutionEntity.establishedDate,
      primaryContactEmail:
        institutionEntity.institutionPrimaryContact.primaryContactEmail,
      primaryContactFirstName:
        institutionEntity.institutionPrimaryContact.primaryContactFirstName,
      primaryContactLastName:
        institutionEntity.institutionPrimaryContact.primaryContactLastName,
      primaryContactPhone:
        institutionEntity.institutionPrimaryContact.primaryContactPhone,
      legalAuthorityEmail:
        institutionEntity.legalAuthorityContact.legalAuthorityEmail,
      legalAuthorityFirstName:
        institutionEntity.legalAuthorityContact.legalAuthorityFirstName,
      legalAuthorityLastName:
        institutionEntity.legalAuthorityContact.legalAuthorityLastName,
      legalAuthorityPhone:
        institutionEntity.legalAuthorityContact.legalAuthorityPhone,
      addressLine1: institutionEntity.institutionAddress.addressLine1,
      addressLine2: institutionEntity.institutionAddress.addressLine2,
      city: institutionEntity.institutionAddress.city,
      country: institutionEntity.institutionAddress.country,
      provinceState: institutionEntity.institutionAddress.provinceState,
      postalCode: institutionEntity.institutionAddress.postalCode,
    };
  }

  async createInstitution(
    userInfo: UserInfo,
    institutionDto: CreateInstitutionDto,
  ): Promise<Institution> {
    const institution = this.create();
    const user = new User();
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );

    if (account == null) {
      //This scenario occurs if basic BCeID users try to push the bceid account into our application.
      this.logger.error(
        "Account information could not be retrieved from BCeID",
      );
      return;
    }

    //Username retrieved from the token
    user.userName = userInfo.userName;
    user.firstName = account.user.firstname;
    user.lastName = account.user.surname;
    user.email = institutionDto.primaryEmail;
    institution.users = [user];
    institution.guid = account.institution.guid;
    institution.legalOperatingName = account.institution.legalName;
    institution.operatingName = institutionDto.operatingName;
    institution.primaryPhone = institutionDto.primaryPhone;
    institution.primaryEmail = institutionDto.primaryEmail;
    institution.website = institutionDto.website;
    institution.regulatingBody = institutionDto.regulatingBody;
    institution.establishedDate = institutionDto.establishedDate;

    //Institution Primary Contact Information
    institution.institutionPrimaryContact = {
      primaryContactFirstName: institutionDto.primaryContactFirstName,
      primaryContactLastName: institutionDto.primaryContactLastName,
      primaryContactEmail: institutionDto.primaryContactEmail,
      primaryContactPhone: institutionDto.primaryContactPhone,
    };

    //Institution Legal Authority Contact Information
    institution.legalAuthorityContact = {
      legalAuthorityFirstName: institutionDto.legalAuthorityFirstName,
      legalAuthorityLastName: institutionDto.legalAuthorityLastName,
      legalAuthorityEmail: institutionDto.legalAuthorityEmail,
      legalAuthorityPhone: institutionDto.legalAuthorityPhone,
    };

    //Institution Address
    institution.institutionAddress = {
      addressLine1: institutionDto.addressLine1,
      addressLine2: institutionDto.addressLine2,
      city: institutionDto.city,
      provinceState: institutionDto.provinceState,
      country: institutionDto.country,
      postalCode: institutionDto.postalCode,
      phone: institutionDto.primaryPhone,
    };

    return await this.save(institution);
  }

  async updateInstitution(userInfo: UserInfo, institutionDto: InstituteDto) {
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );

    if (account == null) {
      //This scenario occurs if basic BCeID users try to push the bceid account into our application.
      this.logger.error(
        "Account information could not be retrieved from BCeID",
      );
      throw new InternalServerErrorException(
        `Unable to fetch account information from BCeID`,
      );
    }

    const institution: Institution = await this.repo.findOneOrFail({
      guid: account.institution.guid,
    });

    const user = await this.userService.getUser(userInfo.idp_user_name);

    if (user) {
      user.email = institutionDto.primaryEmail;
      await this.userService.save(user);
    }

    institution.operatingName = institutionDto.operatingName;
    institution.primaryPhone = institutionDto.primaryPhone;
    institution.primaryEmail = institutionDto.primaryEmail;
    institution.website = institutionDto.website;
    institution.regulatingBody = institutionDto.regulatingBody;
    institution.establishedDate = institutionDto.establishedDate;

    //Institution Primary Contact Information
    institution.institutionPrimaryContact = {
      primaryContactFirstName: institutionDto.primaryContactFirstName,
      primaryContactLastName: institutionDto.primaryContactLastName,
      primaryContactEmail: institutionDto.primaryContactEmail,
      primaryContactPhone: institutionDto.primaryContactPhone,
    };

    //Institution Legal Authority Contact Information
    institution.legalAuthorityContact = {
      legalAuthorityFirstName: institutionDto.legalAuthorityFirstName,
      legalAuthorityLastName: institutionDto.legalAuthorityLastName,
      legalAuthorityEmail: institutionDto.legalAuthorityEmail,
      legalAuthorityPhone: institutionDto.legalAuthorityPhone,
    };

    //Institution Address
    institution.institutionAddress = {
      addressLine1: institutionDto.addressLine1,
      addressLine2: institutionDto.addressLine2,
      city: institutionDto.city,
      provinceState: institutionDto.provinceState,
      country: institutionDto.country,
      postalCode: institutionDto.postalCode,
      phone: institutionDto.primaryPhone,
    };

    return await this.save(institution);
  }

  async institutionDetail(userInfo: UserInfo): Promise<InstitutionDetailDto> {
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );
    const institutionEntity = await this.repo.findOne({
      guid: account.institution.guid,
    });

    return {
      institution: this.toDtoObject(institutionEntity),
      account,
    };
  }
}
