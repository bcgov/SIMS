import { IsNotEmpty } from "class-validator";

export class InstitutionUserPersistAPIInDTO {
  @IsNotEmpty()
  userEmail: string;
}
