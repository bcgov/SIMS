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
  NotConnected = "ERR_NOT_CONNECTED",
}

/**
 * SSH error thrown by the SSH2 SFTP client.
 */
export interface SSHError extends Error {
  code: SSHErrorCodes;
}
