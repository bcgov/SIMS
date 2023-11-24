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
  /** System user */
  systemUser: User = undefined;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Get system user. If not found create a new
   * system user and return the user.
   * @return system user.
   */
  private async getOrCreateSystemUser(): Promise<User> {
    const existingUser = await this.getSystemUser();

    if (existingUser) {
      return existingUser;
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

    return this.getSystemUser();
  }

  /**
   * Load system user.
   */
  async loadSystemUser(): Promise<void> {
    this.systemUser = await this.getOrCreateSystemUser();
  }

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
}
