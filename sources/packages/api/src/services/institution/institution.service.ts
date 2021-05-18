import {
  Injectable,
  Inject,
  InternalServerErrorException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Institution,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  User,
} from "../../database/entities";
import { Connection, Repository } from "typeorm";
import {
  InstitutionUserRole,
  InstitutionUserType,
  UserInfo,
} from "../../types";
import {
  CreateInstitutionDto,
  InstitutionDto,
  InstitutionDetailDto,
} from "../../route-controllers/institution/models/institution.dto";
import { LoggerService } from "../../logger/logger.service";
import { BCeIDService } from "../bceid/bceid.service";
import { InjectLogger } from "../../common";
import { UserService } from "../user/user.service";
import { type } from "ormconfig";

@Injectable()
export class InstitutionService extends RecordDataModelService<Institution> {
  @InjectLogger()
  logger: LoggerService;

  institutionUserRepo: Repository<InstitutionUser>;
  institutionUserTypeAndRoleRepo: Repository<InstitutionUserTypeAndRole>;
  institutionUserAuthRepo: Repository<InstitutionUserAuth>;
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly bceidService: BCeIDService,
    private readonly userService: UserService,
  ) {
    super(connection.getRepository(Institution));
    this.institutionUserRepo = connection.getRepository(InstitutionUser);
    this.institutionUserTypeAndRoleRepo = connection.getRepository(
      InstitutionUserTypeAndRole,
    );
    this.institutionUserAuthRepo = connection.getRepository(
      InstitutionUserAuth,
    );
    this.logger.log("[Created]");
  }

  async createAssociation(
    institution: Institution,
    user: User,
    type: InstitutionUserType = InstitutionUserType.user,
    role?: InstitutionUserRole,
  ): Promise<InstitutionUser> {
    const institutionUser = this.institutionUserRepo.create();
    institutionUser.user = user;
    institutionUser.institution = institution;
    const authType = await this.institutionUserTypeAndRoleRepo.findOneOrFail({
      type,
      role: role || null,
    });
    const auth = this.institutionUserAuthRepo.create();
    auth.authType = authType;
    auth.institutionUser = institutionUser;
    institutionUser.authorizations = [auth];
    institution.users = [institutionUser];

    return await this.institutionUserRepo.save(institutionUser);
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

    await this.createAssociation(institution, user, InstitutionUserType.admin);

    return institution;
  }

  async getInstituteByUserName(userName: string): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .leftJoin("institution.users", "institutionUsers")
      .leftJoin("institutionUsers.user", "user")
      .where("user.userName = :userName", { userName })
      .getOneOrFail();
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
    const user = await this.userService.getUser(userInfo.userName);
    if (!user) {
      throw new UnprocessableEntityException("No user record found for user");
    }
    let institutionEntity = await this.getInstituteByUserName(
      userInfo.userName,
    );
    if (!institutionEntity) {
      // Try to load it from db
      institutionEntity = await this.repo.findOne({
        guid: account.institution.guid,
      });
      if (institutionEntity) {
        // Create association with user
        await this.createAssociation(
          institutionEntity,
          user,
          InstitutionUserType.admin,
        );
      } else {
        throw new UnprocessableEntityException(
          "Unable to find institution for user",
        );
      }
    }
    if (institutionEntity.guid !== account.institution.guid) {
      throw new UnprocessableEntityException(
        "Unable to process BCeID account of current user because account institution guid mismatch",
      );
    }
    institutionEntity.legalOperatingName = account.institution.legalName;
    await this.save(institutionEntity);

    if (user) {
      user.firstName = account.user.firstname;
      user.lastName = account.user.surname;
      await this.userService.save(user);
    }
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
