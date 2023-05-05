import {
  Application,
  Restriction,
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
  Student,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import { createFakeStudent } from "./student";
import { DataSource } from "typeorm";

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
    creator?: User;
  },
  options?: {
    restrictionType?: RestrictionType;
    restrictionCode?: string;
    restrictionCategory?: string;
    actionType?: RestrictionActionType;
    notificationType?: RestrictionNotificationType;
  },
): Promise<StudentRestriction> {
  const restrictionRepo = dataSource.getRepository(Restriction);
  const restriction = await restrictionRepo.findOne({
    where: {
      restrictionType: options?.restrictionType,
      restrictionCode: options?.restrictionCode,
      restrictionCategory: options?.restrictionCategory,
      actionType: options?.actionType,
      notificationType: options?.notificationType,
    },
  });
  const studentRestrictionRepo = dataSource.getRepository(StudentRestriction);
  const studentRestriction = new StudentRestriction();
  studentRestriction.student = relations?.student ?? createFakeStudent();
  studentRestriction.application = relations?.application;
  studentRestriction.isActive = true;
  studentRestriction.restriction = restriction;
  studentRestriction.creator = relations?.creator;
  return studentRestrictionRepo.save(studentRestriction);
}
