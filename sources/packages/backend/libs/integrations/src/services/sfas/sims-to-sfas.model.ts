import { Student } from "@sims/sims-db";

export type StudentDetail = Student & {
  cslfOverawardTotal?: string;
  bcslOverawardTotal?: string;
};

export type ApplicationData = {
  studentId: number;
  applicationId: number;
  programYearId: number;
  studyStartDate?: Date;
  studyEndDate?: Date;
  csgpAwardTotal: number;
  sbsdAwardTotal: number;
  applicationCancelDate?: Date;
};

export type RestrictionData = {
  studentId: number;
  restrictionId: number;
  restrictionCode: string;
  restrictionEffectiveDate: Date;
  restrictionRemovalDate?: Date;
};
