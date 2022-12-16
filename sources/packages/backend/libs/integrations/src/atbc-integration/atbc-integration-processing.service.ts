import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import * as os from "os";
import { SystemUsersService } from "@sims/services/system-users";
import {
  StudentService,
  ATBCService,
  ATBCCreateClientPayload,
  ATBCCreateClientResponse,
} from "../services";

@Injectable()
export class ATBCIntegrationProcessingService {
  constructor(
    private readonly studentService: StudentService,
    private readonly atbcService: ATBCService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Apply for PD status calling the ATBC endpoint.
   * @param studentId student who applied for PD status.
   * @returns ATBC response.
   */
  async applyForPDStatus(studentId: number): Promise<ATBCCreateClientResponse> {
    // Student who requested to apply PD status.
    const student = await this.studentService.getStudentById(studentId);
    const payload: ATBCCreateClientPayload = {
      SIN: student.sinValidation.sin,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      birthDate: new Date(student.birthDate),
    };
    // Call ATBC endpoint to apply for PD status.
    const response = await this.atbcService.ATBCCreateClient(payload);
    const auditUser = await this.systemUsersService.systemUser();

    // TODO: The if condition needs to be enhanced to check the response code
    // TODO: to confirm that API call was successful. At this moment there is no information
    // TODO: on how the response codes could be.
    // TODO: The response code must be used to validate bad request as well.
    if (response) {
      // Update PD sent date.
      await this.studentService.updatePDSentDate(student.id, auditUser);
    }
    return response;
  }

  /**
   * Process all the pending PD requests applied by students.
   */
  async processPendingPDRequests(): Promise<void> {
    // Students who applied for PD and waiting for confirmation.
    const students = await this.studentService.getStudentsAppliedForPD();

    // Used to limit the number of asynchronous operations
    // that will start at the same time.
    const maxPromisesAllowed = os.cpus().length;

    // Hold all the promises that must be processed.
    const promises: Promise<void>[] = [];
    for (const student of students) {
      promises.push(this.atbcService.PDCheckerProcess(student));
      if (promises.length >= maxPromisesAllowed) {
        await Promise.all(promises);
        // Clear the array.
        promises.splice(0, promises.length);
      }
    }
    if (promises.length > 0) {
      // Waits for methods, if any outside the loop.
      await Promise.all(promises);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
