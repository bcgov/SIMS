import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  RecordDataModelService,
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
} from "@sims/sims-db";

/**
 * Manages student applications exceptions detected upon full-time/part-time application
 * submission, usually related to documents uploaded that must be reviewed.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(ApplicationException));
  }

  /**
   * Creates student application exceptions to be assessed by the Ministry.
   * Exceptions are detected during full-time/part-time application submissions
   * and are usually related to documents uploaded that must be reviewed.
   * @param applicationId application that contains the exceptions.
   * @param exceptionNames unique identifier names for the exceptions.
   * causing the changes.
   * @param entityManager entity manager to execute in the transaction.
   * @returns created exception.
   */
  async createException(
    applicationId: number,
    exceptionNames: string[],
    entityManager: EntityManager,
  ): Promise<ApplicationException> {
    const newException = new ApplicationException();
    newException.application = { id: applicationId } as Application;
    newException.exceptionStatus = ApplicationExceptionStatus.Pending;
    newException.exceptionRequests = exceptionNames.map(
      (exceptionName) => ({ exceptionName } as ApplicationExceptionRequest),
    );
    return entityManager.getRepository(ApplicationException).save(newException);
  }

  /**
   * Search entire object properties recursively trying to
   * find properties with the value defined as "studentApplicationException"
   * which identifies an application exception to be reviewed.
   * @param payload object to have the properties checked.
   */
  searchExceptions(payload: unknown): string[] {
    const applicationExceptions: string[] = [];
    this.searchExceptionsRecursively(payload, applicationExceptions);
    return applicationExceptions;
  }

  /**
   * Search entire object properties recursively trying to
   * find properties with the value defined as "studentApplicationException"
   * which identifies an application exception to be reviewed.
   * @param payload object to have the properties checked.
   * @param applicationExceptions keeps the list of all exceptions found.
   */
  private searchExceptionsRecursively(
    payload: unknown,
    applicationExceptions: string[],
  ) {
    if (Array.isArray(payload)) {
      for (const arrayItem of payload) {
        // If the payload is an array, iterate through each item
        // looking for some application exception.
        this.searchExceptionsRecursively(arrayItem, applicationExceptions);
      }
      return;
    }
    // If the payload is an object, iterate through its properties
    // looking for some application exception.
    for (const objectKey of Object.keys(payload)) {
      const propertyValue = payload[objectKey];
      if (!propertyValue) {
        continue;
      }
      // If it is an array or an object it must check the children's array or object properties.
      if (Array.isArray(propertyValue) || typeof propertyValue === "object") {
        this.searchExceptionsRecursively(propertyValue, applicationExceptions);
        continue;
      }
      // Check if the property has the value that determine that its keys represents an exception.
      if (propertyValue === "studentApplicationException") {
        // Check if the same exception was already added, for instance for the
        // cases that the exceptions are added to an array of items like dependents.
        if (applicationExceptions.indexOf(objectKey) === -1) {
          applicationExceptions.push(objectKey);
        }
      }
    }
  }
}
