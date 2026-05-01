import { IsNotEmpty, IsString } from "class-validator";

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
