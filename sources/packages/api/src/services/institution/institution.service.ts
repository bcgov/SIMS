import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Institution, User } from "../../database/entities";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import { CreateInstitutionDto } from "../../route-controllers/institution/models/institution.dto";
import { IUserToken } from "../../auth/userToken.interface";
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
    otherInfo: CreateInstitutionDto,
  ): Promise<Institution> {
    const institution = this.create();
    const user = new User();
    user.userName = userInfo.userName;
    user.email = userInfo.email;
    user.firstName = userInfo.givenNames;
    user.lastName = userInfo.lastName;
    institution.birthdate = new Date(userInfo.birthdate);
    institution.gender = userInfo.gender;

    institution.contactInfo = {
      addresses: [
        {
          addressLine1: otherInfo.addressLine1,
          addressLine2: otherInfo.addressLine2,
          city: otherInfo.city,
          province: otherInfo.provinceState,
          country: otherInfo.country,
          postalCode: otherInfo.postalCode,
        },
      ],
      phone: otherInfo.phone,
    };
    institution.user = user;

    return await this.save(institution);
  }
}
