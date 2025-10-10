import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationExceptionService } from "../../services";
import { getUserFullName } from "../../utilities";
import {
  ApplicationExceptionAPIOutDTO,
  DetailedApplicationExceptionAPIOutDTO,
} from "./models/application-exception.dto";

@Injectable()
export class ApplicationExceptionControllerService {
  constructor(
    private readonly applicationExceptionService: ApplicationExceptionService,
  ) {}

  /**
   * Get a student application exception detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @param options options
   * - `studentId` student id.
   * - `applicationId` application id.
   * - `assessDetails`, if true, will return access details.
   * @returns student application exception information.
   */
  async getExceptionDetails<
    T extends
      | DetailedApplicationExceptionAPIOutDTO
      | ApplicationExceptionAPIOutDTO,
  >(
    exceptionId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
      assessDetails?: boolean;
    },
  ): Promise<T> {
    const applicationException =
      await this.applicationExceptionService.getExceptionDetails(exceptionId, {
        studentId: options?.studentId,
        applicationId: options?.applicationId,
      });
    if (!applicationException) {
      throw new NotFoundException("Student application exception not found.");
    }
    const applicationExceptionDetails: ApplicationExceptionAPIOutDTO = {
      exceptionStatus: applicationException.exceptionStatus,
      submittedDate: applicationException.createdAt,
      exceptionRequests: applicationException.exceptionRequests.map(
        (request) => ({
          exceptionRequestId: request.id,
          exceptionName: request.exceptionName,
          exceptionDescription: request.exceptionDescription,
          exceptionRequestStatus: request.exceptionRequestStatus,
          previouslyApprovedOn:
            request.approvalExceptionRequest?.applicationException
              ?.assessedDate,
        }),
      ),
    };
    if (options?.assessDetails) {
      return {
        ...applicationExceptionDetails,
        noteDescription: applicationException.exceptionNote?.description,
        assessedByUserName: getUserFullName(applicationException.assessedBy),
        assessedDate: applicationException.assessedDate,
      } as T;
    }
    return applicationExceptionDetails as T;
  }
}
