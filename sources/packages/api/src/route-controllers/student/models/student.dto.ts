import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsDefined,
  IsNotEmpty,
  IsOptional,
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

export class GetStudentContactDto {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState?: string;
  country: string;
  postalCode: string;
}

/**
 * Common data saved while creating
 * or updating the student profile.
 * Validations not added to DTO because
 * they are going to be handled by the
 * Form.IO dryRun validation.
 */
export interface SaveStudentDto extends AddressDetailsAPIInDTO {
  phone: string;
  /**
   * SIN is optional during update.
   */
  sinNumber?: string;
}

export interface StudentEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  deliveryMethod: string;
}

export interface SearchStudentRespDto {
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
 * DTO object for student details.
 */
export class StudentDetailAPIOutDTO {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: Date;
  contact: ContactInformationAPIOutDTO;
  pdVerified: boolean;
  pdStatus: StudentPDStatus;
  hasRestriction: boolean;
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

export class StudentInfo {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: Date;
  contact: ContactInformationAPIOutDTO;
  pdVerified: boolean;
  validSin: boolean;
  pdSentDate?: Date;
  pdUpdatedDate?: Date;
  pdStatus: StudentPDStatus;
}

export class AESTFileUploadToStudentAPIInDTO {
  @ArrayMinSize(1)
  associatedFiles: string[];
}
