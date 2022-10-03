import { IsNotEmpty } from "class-validator";

export class InstitutionUserPersistDto {
  @IsNotEmpty()
  userEmail: string;
}
