import { Injectable } from "@nestjs/common";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getDateOnlyFromFormat,
  getISODateOnlyString,
  processInParallel,
} from "@sims/utilities";
import { SystemUsersService } from "@sims/services/system-users";
import {
  StudentService,
  ATBCService,
  ATBCCreateClientPayload,
  ATBCCreateClientResponse,
  ATBC_DATE_FORMAT,
} from "../services";
import { DisabilityStatus } from "@sims/sims-db";
import { StudentDisabilityStatusDetail } from "./models/atbc-integration.model";

@Injectable()
export class ATBCIntegrationProcessingService {
  constructor(
    private readonly studentService: StudentService,
    private readonly atbcService: ATBCService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Apply for disability status calling the ATBC endpoint.
   * @param studentId student who applied for PD status.
   * @returns ATBC response.
   */
  async applyForDisabilityStatus(
    studentId: number,
  ): Promise<ATBCCreateClientResponse> {
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

    // TODO: The if condition needs to be enhanced to check the response code
    // to confirm that API call was successful. At this moment there is no information
    // on how the response codes could be.
    // The response code must be used to validate bad request as well.
    if (response) {
      const auditUser = this.systemUsersService.systemUser;
      // Update PD sent date.
      await this.studentService.updateDisabilityRequested(
        student.id,
        auditUser,
      );
    }
    return response;
  }

  /**
   * Process all the pending disability requests applied by students.
   * @param processSummary process summary for logging.
   * @returns process summary result.
   */
  async processAppliedDisabilityRequests(
    processSummary: ProcessSummary,
  ): Promise<void> {
    // Students who applied for disability status and waiting for confirmation.
    const studentDisabilityUpdates =
      await this.atbcService.getStudentDisabilityStatusUpdatesByDate();

    const studentsToUpdate: StudentDisabilityStatusDetail[] =
      studentDisabilityUpdates.map((student) => ({
        sin: student.SIN,
        lastName: student.APP_LAST_NAME,
        birthDate: getDateOnlyFromFormat(student.BIRTH_DTE, ATBC_DATE_FORMAT),
        disabilityStatus: student.D8Y_TYPE as DisabilityStatus,
        disabilityStatusUpdatedDate: getDateOnlyFromFormat(
          student.D8Y_DTE,
          ATBC_DATE_FORMAT,
        ),
      }));
    let updatedDisabilityStatusCount = 0;
    this.logger.log(
      `Total disability status requests processed: ${studentsToUpdate.length}`,
    );
    processSummary.info(
      `Total disability status requests processed: ${studentsToUpdate.length}`,
    );
    if (studentsToUpdate.length) {
      const processingResults = await processInParallel(
        (studentDisabilityStatusDetail: StudentDisabilityStatusDetail) =>
          this.processStudentDisabilityStatusUpdate(
            studentDisabilityStatusDetail,
          ),
        studentsToUpdate,
      );

      updatedDisabilityStatusCount = processingResults.filter(
        (result) => result,
      ).length;
    }
    processSummary.info(
      `Students updated with disability status: ${updatedDisabilityStatusCount}`,
    );
  }

  /**
   * Update the disability status of the given student.
   * Identify the student by SIN, last name and birth date
   * and update the disability status of the student only if the status has changed.
   * e.g. if ATBC response has same disability status (PD/PPD) which is already present
   * in the system, update does not happen.
   * @param studentDisabilityStatusDetail student disability status details.
   * @return processing status.
   */
  private async processStudentDisabilityStatusUpdate(
    studentDisabilityStatusDetail: StudentDisabilityStatusDetail,
  ): Promise<boolean> {
    const student = await this.studentService.getStudentByPersonalInfo(
      studentDisabilityStatusDetail.sin,
      studentDisabilityStatusDetail.lastName,
      getISODateOnlyString(studentDisabilityStatusDetail.birthDate),
    );
    if (!student) {
      return false;
    }
    if (
      student.disabilityStatus !==
      studentDisabilityStatusDetail.disabilityStatus
    ) {
      this.logger.log(
        `Updating disability status for student id ${student.id}`,
      );
      await this.studentService.updateDisabilityStatus(
        student.id,
        studentDisabilityStatusDetail.disabilityStatus,
        studentDisabilityStatusDetail.disabilityStatusUpdatedDate,
      );
      return true;
    }
    return false;
  }

  @InjectLogger()
  logger: LoggerService;
}
