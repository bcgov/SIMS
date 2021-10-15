import { Controller, Patch } from "@nestjs/common";
import {} from "../../services";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";

@AllowAuthorizedParty(AuthorizedParties.supportingUsers)
@Controller("students")
export class SupportingUserController {
  //constructor() {}

  @Patch()
  async updateSupportingUser(
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // TODO: just do it :D
  }
}
