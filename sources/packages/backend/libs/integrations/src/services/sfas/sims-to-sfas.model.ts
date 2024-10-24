import { Student } from "@sims/sims-db";

export type StudentDetail = Student & {
  cslfOverawardTotal?: string;
  bcslOverawardTotal?: string;
};
