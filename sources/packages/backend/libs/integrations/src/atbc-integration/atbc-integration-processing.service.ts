import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import * as os from "os";
import { SystemUsersService } from "@sims/services/system-users";
import {
  StudentService,
  ATBCService,
  ATBCCreateClientPayload,
  ATBCCreateClientResponse,
  ATBCPDStatus,
} from "../services";
import { Student } from "@sims/sims-db";
import { ProcessPDRequestSummary } from "./models/atbc-integration.model";

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
    const response = await this.atbcService.createClient(payload);
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
  async processPendingPDRequests(): Promise<ProcessPDRequestSummary> {
    // Students who applied for PD and waiting for confirmation.
    const students = await this.studentService.getStudentsAppliedForPD();
    let updatedPDstatusCount = 0;

    if (students.length) {
      this.logger.log(`Processing PD requests for ${students.length} students`);
      // Used to limit the number of asynchronous operations
      // that will start at the same time.
      const maxPromisesAllowed = os.cpus().length;

      // Hold all the promises that must be processed.
      const promises: Promise<boolean>[] = [];
      for (const student of students) {
        promises.push(this.processStudentPDStatus(student));
        if (promises.length >= maxPromisesAllowed) {
          const processingResults = await Promise.all(promises);
          updatedPDstatusCount += processingResults.filter(
            (result) => result,
          ).length;
          // Clear the array.
          promises.splice(0, promises.length);
        }
      }
      if (promises.length > 0) {
        // Waits for methods, if any outside the loop.
        const processingResults = await Promise.all(promises);
        updatedPDstatusCount += processingResults.filter(
          (result) => result,
        ).length;
      }
    }
    return {
      pdRequestsProcessed: students.length,
      pdRequestsUpdated: updatedPDstatusCount,
    };
  }

  /**
   * Check the PD status of given student at ATBC and update the
   * status in db if the status is updated at ATBC end.
   * @param student student.
   */
  private async processStudentPDStatus(student: Student): Promise<boolean> {
    const atbcPDCheckResponse = await this.atbcService.checkStudentPDStatus({
      id: student.id,
      sin: student.sinValidation.sin,
    });

    if (
      atbcPDCheckResponse.e9yStatusId === ATBCPDStatus.Confirmed ||
      atbcPDCheckResponse.e9yStatusId === ATBCPDStatus.Denied
    ) {
      this.logger.log(
        `Updating PD Status for student ${student.id}, status ${atbcPDCheckResponse.e9yStatusId} ${atbcPDCheckResponse.e9yStatus}, `,
      );
      await this.studentService.updatePDStatusNDate(
        student.id,
        atbcPDCheckResponse.e9yStatusId === ATBCPDStatus.Confirmed,
      );
      return true;
    }
    return false;
  }

  @InjectLogger()
  logger: LoggerService;
}
