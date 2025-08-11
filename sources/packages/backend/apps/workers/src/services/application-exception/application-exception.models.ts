/**
 * Application exception data structure extracted from the application dynamic data.
 */
export interface ApplicationDataException {
  /**
   * Unique identifier for an exception.
   * Uses "ApplicationException" as a suffix, which allows its identification
   * inside the application dynamic data.
   */
  key: string;
  /**
   * User friendly name of the exception. For exceptions that can happen multiple times,
   * this is used to identify the exception and it should be appended with some extra information
   * to allow its individual identification, for instance, for parents and dependents, it can be
   * appended with theirs respective names.
   */
  description: string;
  /**
   * Hashable content of the exception, which is used to identify if the exception
   * data has changed and needs to be re-approved.
   * Anything that should not be considered as a change in the exception should not be included here,
   * for instance, file unique names.
   */
  hashableContent: unknown;
  /**
   * List of uploaded files associated with the exception.
   * These files are not included in the hashable content property, as they are
   * individually checked for changes to allow an exception to be
   * considered as the same even if the files are uploaded again.
   * Note: files uploads generates unique file names every time, so the
   * comparison takes into account the file name (provided by the user)
   * and content hash only, to avoid that the unique generated file name
   * to be considered as a change.
   */
  files: ApplicationDataExceptionFile[];
}

/**
 * Expected file structure associated with an application exception.
 * An object in the dynamic data with these two properties can be considered
 * as a file associated with an application exception.
 */
export interface ApplicationDataExceptionFile {
  name: string;
  originalName: string;
}

/**
 * Represents an application exception with a full hash content,
 * that represents the hash of the exception data content and its files.
 */
export interface ApplicationDataExceptionHashed
  extends ApplicationDataException {
  fullHashContent: string;
}
