import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Institution, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import { CreateInstitutionDto } from "../../route-controllers/institution/models/institution.dto";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";

@Injectable()
export class InstitutionService extends RecordDataModelService<Institution> {
  @InjectLogger()
  logger: LoggerService;
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(Institution));
    this.logger.log("[Created]");
  }

  async getInstitutionByUserName(userName: string): Promise<Institution> {
    const institution = await this.repo
      .createQueryBuilder("institution")
      .leftJoinAndSelect("institution.user", "user")
      .where("user.userName = :userNameParam", { userNameParam: userName })
      .getOneOrFail();
    return institution;
  }

  async createInstitution(
    userInfo: UserInfo,
    institutionDto: CreateInstitutionDto,
  ): Promise<Institution> {
    const institution = this.create();
    const user = new User();
    //Username retrieved from the token
    user.userName = userInfo.userName;
    user.email = userInfo.email;
    institution.user = user;

    //Institution Information
    institution.legalOperatingName = institutionDto.legalOperatingName;
    institution.primaryPhone = institutionDto.primaryPhone;
    institution.primaryEmail = institutionDto.primaryEmail;
    institution.website = institutionDto.website;
    institution.institutionType = institutionDto.institutionType;
    institution.regulatingBody = institutionDto.regulatingBody;
    institution.established_date = new Date(institutionDto.establishedDate);

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

    //User story talks about Address and then a mailing address but figma doesnt. Is user going to have both?
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

    //User story talks about Address and then a mailing address but figma doesnt. Is user going to have both?
    //Institution Mailing Address
    institution.institutionMailingAddress = {
      mailingAddressLine1: institutionDto.mailingAddressLine1,
      mailingAddressLine2: institutionDto.mailingAddressLine2,
      mailingCity: institutionDto.mailingCity,
      mailingProvinceState: institutionDto.mailingProvinceState,
      mailingCountry: institutionDto.mailingCountry,
      mailingPostalCode: institutionDto.mailingPostalCode,
    };

    return await this.save(institution);
  }
}
