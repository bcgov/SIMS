import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, IsNull } from "typeorm";
import {
  RecordDataModelService,
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  NoteType,
} from "@sims/sims-db";
import { ApplicationDataExceptionHashed } from "./application-exception.models";
import { CustomNamedError } from "@sims/utilities";
import { APPLICATION_EXCEPTION_ALREADY_ASSOCIATED } from "../../constants";
import { NoteSharedService, SystemUsersService } from "@sims/services";

/**
 * Manages student applications exceptions detected upon full-time/part-time application
 * submission, usually related to documents uploaded that must be reviewed.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(
    dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {
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
      (exceptionName) =>
        ({
          exceptionName,
          exceptionDescription: this.getExceptionDescription(exceptionName),
        } as ApplicationExceptionRequest),
    );
    return entityManager.getRepository(ApplicationException).save(newException);
  }

  /**
   * Save application exceptions using the hashed data information to
   * identify if the exception was already approved for the same application.
   * In case all the exceptions are already approved, the exceptions associated
   * with the application will be considered as approved.
   * @param applicationId application ID.
   * @param studentId student ID to have the note created.
   * @param applicationNumber application number to be used in the note description.
   * @param exceptionRequests list of exception requests with the hashed data.
   * @param entityManager entity manager to execute the query.
   * @returns created exception.
   */
  async saveExceptionFromHashedData(
    applicationId: number,
    studentId: number,
    applicationNumber: string,
    exceptionRequests: ApplicationDataExceptionHashed[],
    entityManager: EntityManager,
  ): Promise<ApplicationException> {
    const previouslyApprovedExceptionRequests =
      await this.getPreviouslyApprovedExceptionRequests(
        applicationId,
        entityManager,
      );
    const now = new Date();
    // Create the new exception to be saved.
    const newException = new ApplicationException();
    newException.exceptionStatus = ApplicationExceptionStatus.Pending;
    newException.creator = this.systemUsersService.systemUser;
    newException.createdAt = now;
    // Create the exceptions requests identifying if the exception was already approved.
    newException.exceptionRequests = exceptionRequests.map(
      (exceptionRequest) =>
        ({
          exceptionName: exceptionRequest.key,
          exceptionDescription: exceptionRequest.description,
          exceptionHash: exceptionRequest.fullHashContent,
          approvalExceptionRequest: this.getPreviouslyApprovedException(
            exceptionRequest,
            previouslyApprovedExceptionRequests,
          ),
          creator: this.systemUsersService.systemUser,
          createdAt: now,
        } as ApplicationExceptionRequest),
    );
    // Check if all exceptions were already approved, to set the exception status.
    const allExceptionsApproved = newException.exceptionRequests.every(
      (exceptionRequest) => !!exceptionRequest.approvalExceptionRequest?.id,
    );
    if (allExceptionsApproved) {
      newException.exceptionStatus = ApplicationExceptionStatus.Approved;
      newException.assessedBy = this.systemUsersService.systemUser;
      newException.assessedDate = now;
      newException.exceptionNote =
        await this.noteSharedService.createStudentNote(
          studentId,
          NoteType.General,
          `Application ${applicationNumber} had ${exceptionRequests.length} exceptions automatically approved.`,
          this.systemUsersService.systemUser.id,
          entityManager,
        );
    }
    // Save the exception to later update the application, allowing the update to detected concurrency changes.
    const savedException = await entityManager
      .getRepository(ApplicationException)
      .save(newException);
    const updateResult = await entityManager.getRepository(Application).update(
      { id: applicationId, applicationException: IsNull() },
      {
        applicationException: savedException,
        modifier: this.systemUsersService.systemUser,
        updatedAt: now,
      },
    );
    // If the application already has an exception associated with it, it will throw an error.
    if (!updateResult.affected) {
      throw new CustomNamedError(
        `Application ID ${applicationId} already has an exception associated with it.`,
        APPLICATION_EXCEPTION_ALREADY_ASSOCIATED,
      );
    }
    return savedException;
  }

  /**
   * Get previously approved exception requests for for any version of the application.
   * The exceptions are ordered by the version creation date, so the first
   * exception request is the first one ever approved.
   * @param applicationId application ID to search for previously approved exceptions.
   * @param entityManager entity manager to execute the query.
   * @returns list of previously approved exception requests.
   */
  private async getPreviouslyApprovedExceptionRequests(
    applicationId: number,
    entityManager: EntityManager,
  ): Promise<ApplicationExceptionRequest[]> {
    const application = await entityManager.getRepository(Application).findOne({
      select: {
        id: true,
        parentApplication: {
          id: true,
          versions: {
            id: true,
            createdAt: true,
            applicationException: {
              id: true,
              exceptionRequests: {
                id: true,
                exceptionName: true,
                exceptionHash: true,
              },
            },
          },
        },
      },
      relations: {
        parentApplication: {
          versions: {
            applicationException: {
              exceptionRequests: true,
            },
          },
        },
      },
      where: {
        id: applicationId,
        parentApplication: {
          versions: {
            applicationException: {
              exceptionStatus: ApplicationExceptionStatus.Approved,
            },
          },
        },
      },
      order: {
        parentApplication: {
          versions: {
            createdAt: "ASC",
          },
        },
      },
    });
    if (!application?.parentApplication?.versions) {
      return [];
    }
    // Flatten the exception requests from all versions of the parent application.
    return application.parentApplication.versions.flatMap(
      (version) => version.applicationException.exceptionRequests,
    );
  }

  /**
   * Get the previously approved exception for a specific exception request.
   * @param exceptionRequest exception request to search for.
   * @param previouslyApprovedExceptionRequests list of previously approved exception requests.
   * @returns previously approved exception request, if found.
   */
  private getPreviouslyApprovedException(
    exceptionRequest: ApplicationDataExceptionHashed,
    previouslyApprovedExceptionRequests: ApplicationExceptionRequest[],
  ): ApplicationExceptionRequest | undefined {
    return previouslyApprovedExceptionRequests.find(
      (exception) =>
        exception.exceptionName === exceptionRequest.key &&
        exception.exceptionHash === exceptionRequest.fullHashContent,
    );
  }

  /**
   * Get the description for a specific application exception.
   * Temporary mapping for known exceptions to be used while the new
   * exception handling process is not available for part-time applications.
   * @param exceptionName unique identifier name of the exception.
   * @returns description of the exception.
   */
  private getExceptionDescription(exceptionName: string): string {
    switch (exceptionName) {
      case "citizenshipForPermanentResidencyApplicationException":
        return "Citizenship for permanent residency";
      case "citizenshipForProtectedPersonsApplicationException":
        return "Citizenship for protected persons";
      case "citizenshipForBCResidencyApplicationException":
        return "Citizenship for B.C. residency";
      case "dependantsIncomeTaxApplicationException":
        return "Dependant's income tax";
      case "dependantsSharedCustodyApplicationException":
        return "Dependant's shared custody";
      case "estrangedFromParentsApplicationException":
        return "Modified Independent";
      case "parentsResidencyApplicationException":
        return "Parent residency";
      case "exceptionalExpensesApplicationException":
        return "Exceptional expenses";
      case "rentLivingSituationApplicationException":
        return "Rent living situation";
      case "transportationApplicationException":
        return "Transportation";
      case "studyEndDateIsPastApplicationException":
        return "Study end date is past";
      case "currentYearIncomeApplicationException":
        return "Current Year Income";
      case "currentYearPartnerIncomeApplicationException":
        return "Partner current year income";
      case "currentYearParentIncomeApplicationException":
        return "Parent current year income";
      case "marriedCommonLawDomesticViolenceApplicationException":
        return "Married/common-law domestic violence";
      default:
        return "Unknown exception";
    }
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
