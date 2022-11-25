import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@sims/sims-db";
import { Repository } from "typeorm";
import { SERVICE_ACCOUNT_DEFAULT_USER_EMAIL } from "../system-configurations-constants";
import { SystemUser, SystemUserDetails } from "./system-users.models";

@Injectable()
export class SystemUsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Get system user.If not found will create a new
   * system user and return the user details.
   * @return system user id.
   */
  private async getSystemUser(): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      select: {
        id: true,
      },
      where: {
        userName: SystemUser.UserName,
      },
    });
    if (existingUser) {
      return existingUser;
    }
    // Create new system user if not exists.
    const user = new User();
    user.userName = SystemUser.UserName;
    user.firstName = null;
    user.lastName = SystemUser.LastName;
    user.email = SERVICE_ACCOUNT_DEFAULT_USER_EMAIL;
    return this.userRepo.save(user);
  }

  /**
   * Get system user details from the cache.
   * If not found will create a new system user
   * and return the user details.
   * @return system user details.
   */
  async queueSystemUser(): Promise<SystemUserDetails> {
    const systemUserKey = "systemUserDetails";
    if (this[systemUserKey]) {
      return this[systemUserKey] as SystemUserDetails;
    }
    this[systemUserKey] = {
      id: (await this.getSystemUser()).id,
    };
    return this[systemUserKey];
  }
}
