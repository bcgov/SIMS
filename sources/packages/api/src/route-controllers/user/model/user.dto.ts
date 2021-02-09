import { IsNotEmpty } from "class-validator";

export default class UserSyncInfoDto {
  @IsNotEmpty()
  firstName: string;
  @IsNotEmpty()
  lastName: string;
  @IsNotEmpty()
  email: string;

}
