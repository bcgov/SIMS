import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { ApplicationException } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ApplicationDataException,
  ApplicationDataExceptionFile,
} from "./application-exception.models";

/**
 * Manages student applications exceptions detected upon full-time/part-time application
 * submission, checking for exceptions already approved for the same student application,
 * avoid the work to analyze the same exception multiple times.
 * An exception should be considered "the same" when its data and files are the same.
 */
@Injectable()
export class ApplicationExceptionUniquenessService {
  constructor(
    @InjectRepository(ApplicationException)
    private readonly applicationException: Repository<ApplicationException>,
  ) {}

  /**
   * Search entire object properties recursively trying to
   * find properties with the value defined as "studentApplicationException"
   * which identifies an application exception to be reviewed.
   * @param payload object to have the properties checked.
   */
  searchExceptionsObjects(payload: unknown): ApplicationDataException[] {
    const applicationExceptions: ApplicationDataException[] = [];
    this.searchExceptionsObjectsRecursively(payload, applicationExceptions);
    return applicationExceptions;
  }

  /**
   * Search entire object properties recursively trying to
   * find properties with the value defined as "studentApplicationException"
   * which identifies an application exception to be reviewed.
   * @param payload object to have the properties checked.
   * @param applicationExceptions keeps the list of all exceptions found.
   */
  private searchExceptionsObjectsRecursively(
    payload: unknown,
    applicationExceptions: ApplicationDataException[],
  ): void {
    if (Array.isArray(payload)) {
      for (const arrayItem of payload) {
        // If the payload is an array, iterate through each item
        // looking for some application exception.
        this.searchExceptionsObjectsRecursively(
          arrayItem,
          applicationExceptions,
        );
      }
      return;
    }
    // If the payload is an object, iterate through its properties
    // looking for some application exception.
    for (const propertyKey of Object.keys(payload)) {
      const propertyValue = payload[propertyKey];
      if (!propertyValue) {
        // No value, continue to the next property.
        continue;
      }
      if (propertyKey.endsWith("ApplicationException")) {
        const exception = this.createApplicationDataException(
          propertyKey,
          propertyValue,
        );
        applicationExceptions.push(exception);
        continue;
      }
      // If it is an array or an object it must check the children's array or object properties.
      if (Array.isArray(propertyValue) || typeof propertyValue === "object") {
        this.searchExceptionsObjectsRecursively(
          propertyValue,
          applicationExceptions,
        );
        continue;
      }
    }
  }

  private createApplicationDataException(
    propertyKey: string,
    applicationData: ApplicationDataException,
  ): ApplicationDataException {
    const files = this.extractFilesFromException(applicationData);
    return {
      key: propertyKey,
      hashableContent: applicationData,
      description: applicationData["exceptionDescription"] as string,
      files,
    };
  }

  /**
   * Extract files from the exception data to avoid that changes
   * be detected due to file changes, for instance, changing the order
   * of the files should not trigger a new exception to be approved.
   * File data like name and content are checked differently.
   * @param exceptionData dynamic object to have its files extracted.
   * @returns list of files extracted from the exception data, if any.
   */
  private extractFilesFromException(
    exceptionData: unknown,
  ): ApplicationDataExceptionFile[] {
    const files: ApplicationDataExceptionFile[] = [];
    this.extractFilesFromExceptionRecursively(exceptionData, files);
    return files;
  }

  /**
   * Recursively extract files from the exception data and removes them.
   * @param exceptionData dynamic object to have its files extracted.
   * @param files list of files extracted from the exception data.
   */
  private extractFilesFromExceptionRecursively(
    exceptionData: unknown,
    files: ApplicationDataExceptionFile[] = [],
  ): void {
    if (Array.isArray(exceptionData)) {
      // The file extraction is executed in a more generic way expecting the
      // file can be at any level or even in an array with a mix of data.
      // This is done to make the search resilient to possible form.io
      // components changes.
      const filesToRemove: number[] = [];
      exceptionData.forEach((item, index) => {
        if (this.isApplicationDataExceptionFile(item)) {
          // If the item is an ApplicationDataExceptionFile, extract its data.
          files.push({ name: item.name, originalName: item.originalName });
          // Mark the index for removal.
          filesToRemove.push(index);
        } else {
          this.extractFilesFromExceptionRecursively(item, files);
        }
      });
      // Remove the files from the exception data.
      filesToRemove.reverse().forEach((index) => {
        exceptionData.splice(index, 1);
      });
      return;
    }
    if (typeof exceptionData === "object") {
      for (const key of Object.keys(exceptionData)) {
        this.extractFilesFromExceptionRecursively(exceptionData[key], files);
      }
    }
  }

  /**
   * Type guard to check if the dynamic object is an ApplicationDataExceptionFile.
   * @param dynamicObject object to be checked.
   * @returns true if the dynamic object is an ApplicationDataExceptionFile, false otherwise.
   */
  private isApplicationDataExceptionFile(
    dynamicObject: unknown,
  ): dynamicObject is ApplicationDataExceptionFile {
    if (typeof dynamicObject !== "object" || dynamicObject === null) {
      return false;
    }
    const candidate = dynamicObject as Record<string, unknown>;
    return (
      typeof candidate.name === "string" &&
      typeof candidate.originalName === "string"
    );
  }
}
