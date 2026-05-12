import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

/**
 * Payload required to set up the application submission load test.
 */
export class SetupApplicationSubmissionAPIInDTO {
  /**
   * User name of the e2e test student that will own all draft applications.
   */
  @IsNotEmpty()
  @IsString()
  studentUserName: string;
}

/**
 * Payload required to set up the workers stress load test.
 */
export class SetupSubmittedApplicationAPIInDTO {
  /**
   * Number of distinct fake students to distribute the submitted applications across.
   * More students means more independent Camunda workflow branches, reducing
   * contention and allowing parallel processing in workers.
   */
  @IsInt()
  @Min(1)
  numberOfStudents: number;
}
