import { BadRequestException } from "@nestjs/common";
import * as path from "path";

const MAX_FILE_SIZE = +process.env.FILE_UPLOAD_MAX_FILE_SIZE;
const ALLOWED_FILE_EXTENSIONS =
  process.env.FILE_UPLOAD_ALLOWED_EXTENSIONS.split(",").map((value) =>
    value.toLowerCase().trim(),
  );

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
) => {
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
  _: any,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  return fileFilter(file, ALLOWED_FILE_EXTENSIONS, callback);
};

/**
 * CSV (comma separated values) filter, used by multer (node.js middleware),
 * to allow only the specific MIME types files.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 */
export const csvFileFilter = (
  _: any,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  return fileFilter(file, [".csv"], callback);
};

/**
 * Default filter, used by multer (node.js middleware),
 * to allow only the specific MIME types files.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 */
const fileFilter = (
  file: MulterFile,
  allowedFileExtensions: string[],
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (allowedFileExtensions.includes(extension)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException("Provided file type is not allowed."),
      false,
    );
  }
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
