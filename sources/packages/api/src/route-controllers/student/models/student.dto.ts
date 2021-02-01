
import { IsNotEmpty, IsOptional} from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  phone: string;
  @IsNotEmpty()
  sinNumber: string;
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  provinceState: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  postalCode: string;
}

