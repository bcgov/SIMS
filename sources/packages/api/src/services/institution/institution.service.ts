import {
  Injectable,
  Inject,
  InternalServerErrorException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Institution, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import {
  CreateInstitutionDto,
  InstitutionDto,
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

  async getInstituteByUserName(userName: string): Promise<Institution> {
    const query = this.repo
      .createQueryBuilder("institution")
      .leftJoinAndSelect("institution.users", "users");
    const institution = await query
      .where("users.userName = :userName", { userName })
      .getOneOrFail();
    return institution;
  }

  async updateInstitution(userInfo: UserInfo, institutionDto: InstitutionDto) {
    const institution: Institution = await this.getInstituteByUserName(
      userInfo.userName,
    );

    const user = await this.userService.getUser(userInfo.userName);

    if (user) {
      user.email = institutionDto.userEmail;
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

  async syncInstitution(userInfo: UserInfo): Promise<void> {
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );
    const institutionEntity = await this.getInstituteByUserName(
      userInfo.userName,
    );
    if (institutionEntity.guid !== account.institution.guid) {
      throw new UnprocessableEntityException(
        "Unable to process BCeID account of current user because account institution guid mismatch",
      );
    }
    institutionEntity.legalOperatingName = account.institution.legalName;
    if (institutionEntity.users && institutionEntity.users.length > 0) {
      const filtered = institutionEntity.users.filter(
        (usr) => usr.userName === userInfo.userName,
      );
      if (filtered.length > 0) {
        const user = filtered[0];
        user.firstName = account.user.firstname;
        user.lastName = account.user.surname;
      }
    }

    await this.save(institutionEntity);
  }

  async institutionDetail(userInfo: UserInfo): Promise<InstitutionDetailDto> {
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );
    const institutionEntity = await this.getInstituteByUserName(
      userInfo.userName,
    );

    const user = await this.userService.getUser(userInfo.userName);

    const institution = InstitutionDto.fromEntity(institutionEntity);
    institution.userEmail = user?.email;
    institution.userFirstName = user?.firstName;
    institution.userLastName = user?.lastName;

    return {
      institution,
      account,
    };
  }
}
