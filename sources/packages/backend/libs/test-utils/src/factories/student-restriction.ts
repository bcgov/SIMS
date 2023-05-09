import {
  Application,
  Restriction,
  Student,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import { createFakeStudent } from "./student";
import { DataSource } from "typeorm";
import { createFakeUser } from "./user";

/**
 * Create and save fake student restriction.
 * @param dataSource data source to persist student restriction.
 * @param relations student restriction entity relations.
 * - `student` related student.
 * - `application` application associated with the student.
 * - `creator` related user relation.
 * @param options related to StudentRestriction.
 * - `restrictionType` option for specifying the restriction type.
 * - `restrictionCode` option for specifying the restriction code.
 * - `restrictionCategory` option for specifying the restriction category.
 * - `actionType` option for specifying the restriction action type.
 * - `notificationType` option for specifying the restriction notification type.
 * @returns persisted student restriction.
 */
export async function saveFakeStudentRestriction(
  dataSource: DataSource,
  relations?: {
    student?: Student;
    application?: Application;
    restriction: Restriction;
    creator?: User;
  },
): Promise<StudentRestriction> {
  const studentRestrictionRepo = dataSource.getRepository(StudentRestriction);
  const userRepo = dataSource.getRepository(User);
  const user = relations?.creator ?? createFakeUser();
  if (!relations?.creator) {
    userRepo.save(user);
  }
  const studentRestriction = new StudentRestriction();
  studentRestriction.student = relations?.student ?? createFakeStudent();
  studentRestriction.application = relations?.application;
  studentRestriction.isActive = true;
  studentRestriction.restriction = relations.restriction;
  studentRestriction.creator = user;
  return studentRestrictionRepo.save(studentRestriction);
}
