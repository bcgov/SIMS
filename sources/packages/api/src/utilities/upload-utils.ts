import { BadRequestException } from "@nestjs/common";
import * as path from "path";

const MAX_FILE_SIZE = +process.env.FILE_UPLOAD_MAX_FILE_SIZE;
const ALLOWED_FILE_EXTENSIONS =
  process.env.FILE_UPLOAD_ALLOWED_EXTENSIONS.split(",").map((value) =>
    value.toLowerCase().trim(),
  );

/**
 * Set an upload limits configuration for multer (node.js middleware).
 * @param fileSize For multipart forms, the max file size (in bytes).
 * @param files For multipart forms, the max number of file fields.
 * @param parts For multipart forms, the max number of parts (fields + files).
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
 * @param req request information.
 * @param file received file.
 * @param callback callback to return the result of the validation.
 */
export const defaultFileFilter = (
  req: any,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_FILE_EXTENSIONS.includes(extension)) {
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
