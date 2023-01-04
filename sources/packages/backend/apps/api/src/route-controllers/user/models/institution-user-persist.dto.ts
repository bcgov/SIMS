import { IsEmail, IsNotEmpty } from "class-validator";

export class InstitutionUserPersistAPIInDTO {
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;
}
