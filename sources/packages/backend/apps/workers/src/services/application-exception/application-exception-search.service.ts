import { Injectable } from "@nestjs/common";
import {
  ApplicationDataException,
  ApplicationDataExceptionFile,
} from "./application-exception.models";
import { APPLICATION_DATA_EXCEPTION_SUFFIX } from "../../constants";

/**
 * Manages student applications exceptions detected upon
 * full-time/part-time application submission.
 * Searches for application exceptions in the dynamic data
 * that will be represented, by convention, by properties
 * with its key suffixed by "ApplicationException".
 */
@Injectable()
export class ApplicationExceptionSearchService {
  /**
   * Search entire object properties recursively trying to
   * find properties with its key suffixed by "ApplicationException"
   * which identifies an application exception to be reviewed.
   * @param payload object to have the properties checked.
   */
  search(payload: unknown): ApplicationDataException[] {
    const applicationExceptions: ApplicationDataException[] = [];
    this.searchExceptionsObjectsRecursively(payload, applicationExceptions);
    return applicationExceptions;
  }

  /**
   * Search entire object properties recursively trying to
   * find properties with its key suffixed by "ApplicationException"
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
      if (propertyKey.endsWith(APPLICATION_DATA_EXCEPTION_SUFFIX)) {
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
      }
    }
  }

  /**
   * Creates the ApplicationDataException object from the dynamic
   * data that was identified as an application exception.
   * @param propertyKey key of the property that identified the exception.
   * @param exceptionDynamicData student application exception data.
   * @returns
   */
  private createApplicationDataException(
    propertyKey: string,
    exceptionDynamicData: unknown,
  ): ApplicationDataException {
    const files = this.extractFilesFromException(exceptionDynamicData);
    return {
      key: propertyKey,
      hashableContent: exceptionDynamicData,
      description: exceptionDynamicData["exceptionDescription"] as string,
      files,
    };
  }

  /**
   * Extract files from the exception data to avoid that changes
   * be detected due to file changes, for instance, changing the order
   * of the files should not trigger a new exception to be approved.
   * File data, like name and content, are checked differently.
   * @param exceptionDynamicData dynamic object to have its files extracted.
   * @returns list of files extracted from the exception data, if any.
   */
  private extractFilesFromException(
    exceptionDynamicData: unknown,
  ): ApplicationDataExceptionFile[] {
    const files: ApplicationDataExceptionFile[] = [];
    this.extractFilesFromExceptionRecursively(exceptionDynamicData, files);
    return files;
  }

  /**
   * Recursively extract files from the exception data and removes them.
   * @param exceptionData dynamic object to have its files extracted.
   * @param files list of files extracted from the exception data.
   */
  private extractFilesFromExceptionRecursively(
    exceptionDynamicData: unknown,
    files: ApplicationDataExceptionFile[] = [],
  ): void {
    if (Array.isArray(exceptionDynamicData)) {
      let isFileArray = false;
      exceptionDynamicData.forEach((item) => {
        if (this.isApplicationDataExceptionFile(item)) {
          // If the item is an ApplicationDataExceptionFile, extract its data.
          files.push({ name: item.name, originalName: item.originalName });
          isFileArray = true;
        }
      });
      if (isFileArray) {
        // If the array contains files, remove all items from
        // the array (only files are expected inside the array).
        exceptionDynamicData.length = 0;
      }
      return;
    }
    if (typeof exceptionDynamicData === "object") {
      for (const key of Object.keys(exceptionDynamicData)) {
        this.extractFilesFromExceptionRecursively(
          exceptionDynamicData[key],
          files,
        );
      }
    }
  }

  /**
   * Type guard to check if the dynamic object is an {@see ApplicationDataExceptionFile}.
   * @param dynamicObject object to be checked.
   * @returns true if the dynamic object is an {@see ApplicationDataExceptionFile}, false otherwise.
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
