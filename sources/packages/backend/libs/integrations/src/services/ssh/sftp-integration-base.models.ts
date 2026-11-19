/**
 * Represents a single line in a integration file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface FixedFormatFileLine {
  getFixedFormat(): string;
}

/**
 * Represents a single fixed format line in an integration file.
 */
export abstract class IntegrationFileLine implements FixedFormatFileLine {
  /**
   * Get the fixed format line of an integration file.
   * Note:This method must not be overridden by derived classes.
   * Derived classes should implement the getFixedFormatLine method instead.
   * @returns The fixed format line as a string.
   */
  getFixedFormat(): string {
    try {
      return this.getFixedFormatLine();
    } catch (error) {
      throw new Error(
        `Unexpected error generating fixed format line for context: ${JSON.stringify(this.getContext())}`,
        { cause: error },
      );
    }
  }
  /**
   * Fixed format line value.
   * Derived classes should implement this method to provide the fixed format line.
   * @returns The fixed format line as a string.
   */
  protected abstract getFixedFormatLine(): string;
  /**
   * Context information typically includes key/unique details about line to help identify it in logs or error messages.
   * @returns The context information as a string.
   */
  protected abstract getContext(): Record<string, string | number | Date>;
}

/**
 * Enumeration for SSH2 SFTP item types.
 */
export enum SFTPItemType {
  /**
   * Regular File: This is a standard data file. SFTP clients can perform typical
   * file operations on regular files such as reading, writing, creating, and deleting.
   */
  File = "-",
  /**
   * Symbolic Link: This is a special type of file that acts as a reference or pointer
   * to another file or directory. It allows multiple references to the same file or
   * directory without duplicating the actual data.
   */
  SymbolicLink = "l",
  /**
   * Directory: This represents a folder or directory in the file system. Directories can
   * contain files and other directories, allowing for hierarchical organization of data.
   */
  Directory = "d",
}

/**
 * Enumeration for SSH error codes.
 */
export enum SSHErrorCodes {
  /**
   * Error code indicating that the client is not connected.
   * This error typically occurs when an operation is attempted
   * without an active connection to the SSH server, either because
   * one was never established or has been lost.
   */
  NotConnected = "ERR_NOT_CONNECTED",
}

/**
 * SSH error thrown by the SSH2 SFTP client.
 */
export interface SSHError extends Error {
  code: SSHErrorCodes;
}
