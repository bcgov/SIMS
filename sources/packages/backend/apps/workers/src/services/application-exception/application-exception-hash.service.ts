import { Injectable } from "@nestjs/common";
import { In, Repository } from "typeorm";
import { StudentFile } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ApplicationDataException,
  ApplicationDataExceptionHashed,
} from "./application-exception.models";
import { createHash } from "crypto";

@Injectable()
export class ApplicationExceptionHashService {
  constructor(
    @InjectRepository(StudentFile)
    private readonly studentFileRepo: Repository<StudentFile>,
  ) {}

  async createHashedApplicationExceptions(
    exceptions: ApplicationDataException[],
  ): Promise<ApplicationDataExceptionHashed[]> {
    const filesHashMap = await this.getFilesHashMapForExceptions(exceptions);
    return exceptions.map((exception) =>
      this.hashContent(exception, filesHashMap),
    );
  }

  private hashContent(
    exception: ApplicationDataException,
    filesHashMap: Record<string, string>,
  ): ApplicationDataExceptionHashed {
    // Combine all file hashes in a sorted manner to ensure consistent ordering.
    const filesHashes = exception.files
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((file) => {
        return filesHashMap[file.name];
      });
    // Combine the exception data content and its files hashes to create a full hash.
    const fullStringContent =
      JSON.stringify(exception.hashableContent) + filesHashes.join();
    const hashedException = exception as ApplicationDataExceptionHashed;
    hashedException.fullHashContent = createHash("sha256")
      .update(fullStringContent)
      .digest("hex");
    return hashedException;
  }

  private async getFilesHashMapForExceptions(
    exceptions: ApplicationDataException[],
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
      where: { uniqueFileName: In(filesUniqueNames) },
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
