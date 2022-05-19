import { FileOriginType } from "@/types";
import { ContactInformationAPIOutDTO } from "./Address.dto";

export interface StudentProfileAPIOutDTO {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  dateOfBirth: Date;
  contact: ContactInformationAPIOutDTO;
  pdVerified: boolean;
  validSin: boolean;
  sin: string;
  pdSentDate: string;
  pdUpdatedDate: string;
  pdStatus: string;
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploaderInfoAPIInDTO {
  documentPurpose: string;
  applicationNumber?: string;
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploaderAPIInDTO {
  submittedForm: StudentFileUploaderInfoAPIInDTO;
  associatedFiles: string[];
}

export interface AESTFileUploadToStudentAPIInDTO {
  associatedFiles: string[];
}

/**
 *  Student uploaded documents (i.e, FileOriginType.Student documents).
 */
export interface StudentUploadFileAPIOutDTO {
  fileName: string;
  uniqueFileName: string;
  fileOrigin: FileOriginType;
}

/**
 *  AEST user to view student uploaded documents.
 */
export interface AESTStudentFileAPIOutDTO extends StudentUploadFileAPIOutDTO {
  metadata: StudentFileMetadataAPIOutDTO;
  groupName: string;
  updatedAt: Date;
}

export interface StudentFileMetadataAPIOutDTO {
  applicationNumber?: string;
}
