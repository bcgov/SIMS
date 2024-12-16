import { OfferingIntensity, Student } from "@sims/sims-db";

export type StudentDetail = Student & {
  cslfOverawardTotal?: string;
  bcslOverawardTotal?: string;
};

export interface ApplicationRecord {
  studentId: number;
  applicationNumber: string;
  programYear: string;
  studyStartDate: Date;
  studyEndDate: Date;
  csgpAwardTotal: number;
  sbsdAwardTotal: number;
  applicationCancelDate?: Date;
  offeringIntensity: OfferingIntensity;
}
