import { IsNotEmpty, IsOptional } from "class-validator";

export class InstitutionUserDto {
  
    @IsNotEmpty()
    userFirstName: string;
  
    @IsNotEmpty()
    userLastName: string;
  
    @IsNotEmpty()
    userEmail: string;
  }