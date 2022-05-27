import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsDefined,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { RestrictionNotificationType } from "../../../database/entities/restriction-notification-type.type";
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
 * DTO for student restriction.
 * This object is returned by controller.
 */
export class StudentRestrictionAPIOutDTO {
  /**
   * code is the restriction code.
   */
  code: string;
  /**
   * type is the notification type.
   */
  type: RestrictionNotificationType;
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
