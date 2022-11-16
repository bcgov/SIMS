import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Institution } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class InstitutionHelperService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
  ) {}

  /**
   * Method to get the institution by username.
   * @param userName username.
   * @returns institution.
   */
  async getInstitutionByUserName(userName: string): Promise<Institution> {
    return this.institutionRepo.findOne({
      select: {
        id: true,
        users: true,
        institutionType: {
          id: true,
        },
      },
      where: {
        users: {
          user: {
            userName: userName,
          },
        },
      },
      relations: {
        users: {
          user: true,
        },
        institutionType: true,
      },
    });
  }
}
