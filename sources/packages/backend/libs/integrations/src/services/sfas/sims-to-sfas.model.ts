import { OfferingIntensity, Student } from "@sims/sims-db";

export type StudentDetail = Student & {
  cslfOverawardTotal?: string;
  bcslOverawardTotal?: string;
};

export type ApplicationRecord = {
  studentId: number;
  applicationId: number;
  programYear: string;
  studyStartDate?: Date;
  studyEndDate?: Date;
  csgpAwardTotal: number;
  sbsdAwardTotal: number;
  applicationCancelDate?: Date;
  offeringIntensity: OfferingIntensity;
};

export type RestrictionRecord = {
  studentId: number;
  restrictionId: number;
  restrictionCode: string;
  restrictionEffectiveDate: Date;
  restrictionRemovalDate?: Date;
};
