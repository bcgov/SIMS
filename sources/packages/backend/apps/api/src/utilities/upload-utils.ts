import { BadRequestException, FileValidator } from "@nestjs/common";
import { extname } from "node:path";

const MAX_FILE_SIZE = +process.env.FILE_UPLOAD_MAX_FILE_SIZE;
const MIN_FILE_SIZE = 1;
const ALLOWED_FILE_EXTENSIONS =
  process.env.FILE_UPLOAD_ALLOWED_EXTENSIONS?.split(",").map((value) =>
    value.toLowerCase().trim(),
  ) ?? [];

/**
 * Set an upload limits configuration for multer (node.js middleware).
 * @param files For multipart forms, the max number of file fields.
 * @param parts For multipart forms, the max number of parts (fields + files).
 * @param fileSize For multipart forms, the max file size (in bytes).
 * @returns limits object.
 */
export const uploadLimits = (
  files: number,
  parts: number,
  fileSize = MAX_FILE_SIZE,
): { files: number; parts: number; fileSize: number } => {
  return {
    files,
    parts,
    fileSize,
  };
};

/**
 * Default filter, used by multer (node.js middleware),
 * to allow only the specific MIME types files.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 */
export const defaultFileFilter = (
  _: unknown,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  return fileFilter(file, ALLOWED_FILE_EXTENSIONS, callback);
};

/**
 * CSV (comma separated values) filter, used by multer (node.js middleware),
 * to allow only the specific MIME types files.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 */
export const csvFileFilter = (
  _: unknown,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  return fileFilter(file, [".csv"], callback);
};

/**
 * Default filter, used by multer (node.js middleware),
 * to allow only the specific MIME types files.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 * @param options additional options.
 * - `allowedMimeType` allowed MimeType for the file.
 */
const fileFilter = (
  file: MulterFile,
  allowedFileExtensions: string[],
  callback: (error: Error | null, acceptFile: boolean) => void,
  options?: { allowedMimeType?: string[] },
): void => {
  const isValidMimeType = options?.allowedMimeType
    ? options?.allowedMimeType.includes(file.mimetype)
    : true;

  const extension = extname(file.originalname).toLowerCase();
  if (allowedFileExtensions.includes(extension) && isValidMimeType) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException("Provided file type is not allowed."),
      false,
    );
  }
};

/**
 * TXT file filter, used by multer (node.js middleware),
 * to allow only the specific MIME types files.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 */
export const textFileFilter = (
  _: unknown,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  return fileFilter(file, [".txt"], callback, {
    allowedMimeType: ["text/plain"],
  });
};

export interface MulterFile {
  /** Field name specified in the form */
  fieldname: string;
  /** Name of the file on the user's computer */
  originalname: string;
  /** Encoding type of the file */
  encoding: string;
  /** Mime type of the file */
  mimetype: string;
  /** Size of the file in bytes */
  size: number;
  /** The folder to which the file has been saved (DiskStorage) */
  destination: string;
  /** The name of the file within the destination (DiskStorage) */
  filename: string;
  /** Location of the uploaded file (DiskStorage) */
  path: string;
  /** A Buffer of the entire file (MemoryStorage) */
  buffer: Buffer;
}

/**
 * Minimum file size validation options.
 */
interface MinFileSizeValidationOptions {
  /**
   * Minimum file size in bytes.
   */
  minFileSize: number;
}

/**
 * Validates whether an uploaded file meets the minimum allowed size.
 * This is implemented as a FileValidator as Multer doesn't have support for minimum file size validation.
 */
export class MinFileSizeValidator extends FileValidator<MinFileSizeValidationOptions> {
  constructor(validationOptions?: MinFileSizeValidationOptions) {
    super(validationOptions ?? { minFileSize: MIN_FILE_SIZE });
  }

  /**
   * Validates the uploaded file minimum size.
   * @param file uploaded file to be validated.
   * @returns true when the file size is greater than or equal to the configured minimum.
   */
  isValid(file?: Express.Multer.File): boolean {
    return !!file && file.size >= this.validationOptions.minFileSize;
  }

  /**
   * Builds the validation error message.
   * @returns validation error message.
   */
  buildErrorMessage(): string {
    return `File must be at least ${this.validationOptions.minFileSize} byte(s).`;
  }
}
