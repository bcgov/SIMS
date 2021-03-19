import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Institution, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import { CreateInstitutionDto } from "../../route-controllers/institution/models/institution.dto";
import { LoggerService } from "../../logger/logger.service";
import { BCeIDService } from "../bceid/bceid.service";
import { InjectLogger } from "../../common";

@Injectable()
export class InstitutionService extends RecordDataModelService<Institution> {
  @InjectLogger()
  logger: LoggerService;
  @Inject()
  bceidService: BCeIDService;

  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(Institution));
    this.logger.log("[Created]");
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
    console.log("here");
    console.dir(account);
    if (account == null) {
      //TODO: This scenario occurs when basic BCeID users try to push the bceid account into our application.
      //Ideally this should be handled at the login page where a Basic BCeID user should NOT be allowed to enter the portal
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
    institution.establishedDate = new Date(institutionDto.establishedDate);

    //Institution Primary Contact Information
    institution.institutionPrimaryContact = {
      primaryContactFirstName: institutionDto.primaryContactFirstName,
      primaryContactLastName: institutionDto.primaryContactLastName,
      primaryContactEmail: institutionDto.primaryContactEmail,
      primaryPhone: institutionDto.primaryPhone,
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
}
