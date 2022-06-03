import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import {
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  User,
} from "../../database/entities";

/**
 * Manages student applications exceptions detected upon application submission.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(connection: Connection) {
    super(connection.getRepository(ApplicationException));
  }

  /**
   * Creates the exceptions associated with the application.
   * @param applicationId application that contains the exceptions.
   * @param exceptionNames unique identifier names for the exceptions.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   */
  async createException(
    applicationId: number,
    exceptionNames: string[],
    auditUserId: number,
  ): Promise<ApplicationException> {
    const creator = { id: auditUserId } as User;
    const newException = new ApplicationException();
    newException.application = { id: applicationId } as Application;
    newException.creator = creator;
    newException.exceptionStatus = ApplicationExceptionStatus.Pending;
    newException.exceptionRequests = exceptionNames.map(
      (exceptionName) =>
        ({ exceptionName, creator } as ApplicationExceptionRequest),
    );
    return this.repo.save(newException);
  }
}
