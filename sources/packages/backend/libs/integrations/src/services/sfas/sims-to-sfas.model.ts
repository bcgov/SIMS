import { Student } from "@sims/sims-db";

export type StudentRecord = Student & {
  cslfOverawardTotal?: string;
  bcslOverawardTotal?: string;
};
