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
  private systemUserDetails: User = undefined;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Get system user. If not found create a new
   * system user and return the user.
   * @return system user.
   */
  private async getSystemUser(): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      select: {
        id: true,
      },
      where: {
        userName: SYSTEM_USER_USER_NAME,
      },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new system user if not exists.
    const user = new User();
    user.userName = SYSTEM_USER_USER_NAME;
    user.lastName = SYSTEM_USER_LAST_NAME;
    user.email = SERVICE_ACCOUNT_DEFAULT_USER_EMAIL;
    return this.userRepo.save(user);
  }

  /**
   * Get system user details from the cache.
   * If not found will create a new system user
   * and return the user details.
   * @return system user details.
   */
  async systemUser(): Promise<User> {
    if (this.systemUserDetails) {
      return this.systemUserDetails;
    }

    this.systemUserDetails = await this.getSystemUser();
    return this.systemUserDetails;
  }
}
