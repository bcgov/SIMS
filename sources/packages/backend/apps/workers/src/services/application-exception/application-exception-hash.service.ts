import { Injectable } from "@nestjs/common";
import { In, Repository } from "typeorm";
import { StudentFile } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ApplicationDataException,
  ApplicationDataExceptionHashed,
} from "./application-exception.models";
import { hashObjectToHex } from "@sims/utilities";

/**
 * Process {@see ApplicationDataException} to create a hash
 * that represents the exception data content and its files.
 */
@Injectable()
export class ApplicationExceptionHashService {
  constructor(
    @InjectRepository(StudentFile)
    private readonly studentFileRepo: Repository<StudentFile>,
  ) {}

  /**
   * Creates hashed representations of application exceptions.
   * @param exceptions application exceptions to hash.
   * @param studentId ID of the student associated with the exceptions.
   * Used for authorization purposes to ensure the user has access to the files.
   * @returns hashed application exceptions.
   */
  async createHashedApplicationExceptions(
    exceptions: ApplicationDataException[],
    studentId: number,
  ): Promise<ApplicationDataExceptionHashed[]> {
    const filesHashMap = await this.getFilesHashMapForExceptions(
      exceptions,
      studentId,
    );
    return exceptions.map((exception) =>
      this.hashContent(exception, filesHashMap),
    );
  }

  /**
   * Hashes the content of an application exception.
   * @param exception application exception to hash.
   * @param filesHashMap map of file names to their hash values.
   * @returns hashed application exception.
   */
  private hashContent(
    exception: ApplicationDataException,
    filesHashMap: Record<string, string>,
  ): ApplicationDataExceptionHashed {
    // Combine all file hashes in a sorted manner to ensure consistent ordering.
    exception.files.sort((a, b) => a.name.localeCompare(b.name));
    const filesHashes = exception.files.map((file) => {
      const fileHash = filesHashMap[file.name];
      if (!fileHash) {
        throw new Error(
          `File hash not found for file: ${file.name}. Ensure the file exists in the database.`,
        );
      }
      return fileHash;
    });
    // Combine the exception data content and its files hashes to create a full hash.
    const fullStringContent =
      JSON.stringify(exception.hashableContent) + filesHashes.join();
    const hashedException = exception as ApplicationDataExceptionHashed;
    hashedException.fullHashContent = hashObjectToHex(fullStringContent);
    return hashedException;
  }

  /**
   * Creates a map of file names to their hash values for the given application exceptions.
   * @param exceptions application exceptions to process.
   * @param studentId ID of the student associated with the exceptions.
   * Used for authorization purposes to ensure the user has access to the files.
   * @returns map of file names to their hash values.
   */
  private async getFilesHashMapForExceptions(
    exceptions: ApplicationDataException[],
    studentId: number,
  ): Promise<Record<string, string>> {
    const filesUniqueNames = exceptions
      .flatMap((exception) => exception.files)
      .map((file) => file.name);
    if (filesUniqueNames.length === 0) {
      return {};
    }
    // Fetch files from the database to get their hashes.
    const files = await this.studentFileRepo.find({
      select: {
        fileName: true,
        uniqueFileName: true,
        fileHash: true,
      },
      where: {
        uniqueFileName: In(filesUniqueNames),
        student: { id: studentId },
      },
    });
    const filesHashMap: Record<string, string> = {};
    files.forEach((file) => {
      // Create file hash content including the file name (not the unique file name) to ensure
      // changes to the file name or content will result in a different hash.
      filesHashMap[file.uniqueFileName] = `${file.fileName}_${file.fileHash}`;
    });
    return filesHashMap;
  }
}
