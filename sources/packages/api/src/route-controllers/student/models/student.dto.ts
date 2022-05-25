import { Type } from "class-transformer";
import {
  Allow,
  ArrayMinSize,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  Length,
  ValidateIf,
} from "class-validator";
import { FileOriginType } from "../../../database/entities/student-file.type";
import {
  AddressAPIOutDTO,
  AddressDetailsAPIInDTO,
} from "../../../route-controllers/models/common.dto";
import { StudentPDStatus } from "../../../types";

export class ContactInformationAPIOutDTO {
  address: AddressAPIOutDTO;
  phone: string;
}

export class StudentContactAPIOutDTO {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState?: string;
  country: string;
  postalCode: string;
}

/**
 * Data saved while creating the student profile.
 * SIN validation not added to DTO because it is going
 * to be handled by the Form.IO dryRun validation.
 */
export class CreateStudentAPIInDTO extends AddressDetailsAPIInDTO {
  @Length(10, 20)
  phone: string;
  @Allow()
  sinNumber: string;
}

/**
 * Updates the student information that the student is allowed to change
 * in the solution. Other data must be edited outside (e.g. BCSC).
 */
export class UpdateStudentAPIInDTO extends AddressDetailsAPIInDTO {
  @Length(10, 20)
  phone: string;
}

export interface StudentEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  deliveryMethod: string;
}

export class AESTStudentSearchAPIInDTO {
  @ValidateIf((input) => !input.lastName && !input.appNumber)
  @IsNotEmpty()
  firstName: string;
  @ValidateIf((input) => !input.firstName && !input.appNumber)
  @IsNotEmpty()
  lastName: string;
  @ValidateIf((input) => !input.firstName && !input.lastName)
  @IsNotEmpty()
  appNumber: string;
}

export class SearchStudentAPIOutDTO {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}

/**
 * DTO Object for student restriction.
 * This object is returned by controller.
 */
export interface StudentRestrictionDTO {
  hasRestriction: boolean;
  hasFederalRestriction: boolean;
  hasProvincialRestriction: boolean;
  restrictionMessage: string;
}

/**
 *  Student uploader interface
 */
export class StudentFileUploaderInfoAPIInDTO {
  @IsNotEmpty()
  documentPurpose: string;
  @IsOptional()
  applicationNumber?: string;
}

/**
 *  Student uploader interface
 */
export class StudentFileUploaderAPIInDTO {
  @IsDefined()
  @Type(() => StudentFileUploaderInfoAPIInDTO)
  submittedForm: StudentFileUploaderInfoAPIInDTO;
  @ArrayMinSize(1)
  associatedFiles: string[];
}

/**
 *  Student uploaded documents (i.e, FileOriginType.Student documents).
 */
export class StudentUploadFileAPIOutDTO {
  fileName: string;
  uniqueFileName: string;
  fileOrigin: FileOriginType;
}

/**
 *  AEST user to view student uploaded documents.
 */
export class AESTStudentFileAPIOutDTO extends StudentUploadFileAPIOutDTO {
  metadata: StudentFileMetadataAPIOutDTO;
  groupName: string;
  updatedAt: Date;
}

export class StudentFileMetadataAPIOutDTO {
  applicationNumber?: string;
}

export class StudentProfileAPIOutDTO {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  contact: ContactInformationAPIOutDTO;
  validSin: boolean;
  pdStatus: StudentPDStatus;
}

export class AESTFileUploadToStudentAPIInDTO {
  @ArrayMinSize(1)
  associatedFiles: string[];
}
