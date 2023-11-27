import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@sims/sims-db";
import { SERVICE_ACCOUNT_DEFAULT_USER_EMAIL } from "@sims/utilities";
import { Repository } from "typeorm";
import {
  SYSTEM_USER_LAST_NAME,
  SYSTEM_USER_USER_NAME,
} from "./system-users.models";

@Injectable()
export class SystemUsersService {
  /**
   * User which indicates the system for audit purpose.
   */
  private systemUserInternal: User = undefined;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Load system user.
   */
  async loadSystemUser(): Promise<void> {
    const existingSystemUser = await this.getSystemUser();

    //If the system user already exist, assign to cached variable.
    if (existingSystemUser) {
      this.systemUserInternal = existingSystemUser;
      return;
    }

    // Create new system user if not exists.
    const user = new User();
    user.userName = SYSTEM_USER_USER_NAME;
    user.lastName = SYSTEM_USER_LAST_NAME;
    user.email = SERVICE_ACCOUNT_DEFAULT_USER_EMAIL;
    await this.userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(user)
      .orIgnore("ON CONSTRAINT users_user_name_key DO NOTHING")
      .execute();

    this.systemUserInternal = await this.getSystemUser();
  }

  /**
   * Get system user by system user name.
   * @returns system user.
   */
  private async getSystemUser(): Promise<User> {
    return this.userRepo.findOne({
      select: {
        id: true,
      },
      where: {
        userName: SYSTEM_USER_USER_NAME,
      },
    });
  }

  /**
   * Get system user.
   */
  get systemUser() {
    return this.systemUserInternal;
  }
}
