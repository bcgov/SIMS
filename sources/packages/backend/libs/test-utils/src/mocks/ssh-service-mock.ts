import * as Client from "ssh2-sftp-client";
import { SshService } from "@sims/integrations/services";
import { DeepMocked } from "@golevelup/ts-jest";
import { END_OF_LINE, FILE_DEFAULT_ENCODING } from "@sims/utilities";
import { readFileSync } from "fs";
import { LINE_BREAK_SPLIT_REGEX } from "@sims/integrations/constants";

// MSFAA received files mocks.
export const MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD =
  "msfaa-part-time-receive-file-with-cancelation-record.dat";
export const MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT =
  "msfaa-part-time-receive-file-with-invalid-records-count.dat";
export const MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL =
  "msfaa-part-time-receive-file-with-invalid-sin-hash-total.dat";
export const MSFAA_PART_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD =
  "msfaa-part-time-receive-file-with-reactivation-record.dat";
export const MSFAA_FULL_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD =
  "msfaa-full-time-receive-file-with-reactivation-record.dat";
export const MSFAA_FULL_TIME_RECEIVE_FILE_WITH_SINGLE_CANCELLATION_RECORD =
  "msfaa-full-time-receive-file-with-single-cancellation-record.dat";

/**
 * Represents a mocked uploaded file.
 */
export interface UploadedFile {
  remoteFilePath: string;
  fileLines: string[];
}

/**
 * Creates a mocked {@link SshService} with a mocked SSH {@link Client}.
 * @param sshClientMock SSH client to be returned by the {@link SshService}.
 * @returns mocked {@link SshService}.
 */
export function createSSHServiceMock(
  sshClientMock: DeepMocked<Client>,
): SshService {
  const sshServiceMock = new SshService();
  sshServiceMock.createClient = jest.fn().mockResolvedValue(sshClientMock);
  SshService.closeQuietly = jest.fn();
  return sshServiceMock;
}

/**
 * Get the parameters provided to the put method of the SSH client that
 * represents the data that would be uploaded to the SFTP in a real scenario.
 * @param sshClientMock SSH mocked client.
 * @returns file name and file content of the supposed-to-be uploaded file.
 */
export function getUploadedFile(
  sshClientMock: DeepMocked<Client>,
): UploadedFile {
  const [uploadedFile] = getUploadedFiles(sshClientMock);
  return uploadedFile;
}

/**
 * Get the parameters provided to the put method of the SSH client that represents the
 * remote file(s) path and the data that would be uploaded to the SFTP in a real scenario.
 * @param sshClientMock SSH mocked client.
 * @returns file(s) name and file(s) content of the supposed-to-be uploaded file(s).
 */
export function getUploadedFiles(
  sshClientMock: DeepMocked<Client>,
): UploadedFile[] {
  if (!sshClientMock.put.mock.calls.length) {
    throw new Error(
      "SSH client mock was not invoked which means that there was no attempt to upload a file.",
    );
  }
  return sshClientMock.put.mock.calls.map(([input, remoteFilePath]) => {
    const uploadedFile = {} as UploadedFile;
    if (input) {
      uploadedFile.fileLines = input.toString().split(END_OF_LINE);
    }
    if (remoteFilePath) {
      uploadedFile.remoteFilePath = remoteFilePath.toString();
    }
    return uploadedFile;
  });
}

/**
 * Create the mocks to allow the simulation of a file download from
 * the SFTP. Based on file names provided, real files content will be
 * retrieved from the disk.
 * When performing SFTP calls to request the files two methods are used,
 * the first one (list) is used to retrieve the files available to be downloaded,
 * the second one (get) will be actually returning the file content.
 * This helper allows the mock of the list and get methods in a way the first one
 * will provide the file name to the second one, allowing it to know which specific
 * file should be retrieved from the disk.
 * @param sshClientMock SSH client mock to have the list and get
 * methods mocked.
 * @param filePaths list of files to be returned from the disk.
 * @param fileTransformation allow the file content to be manipulated
 * before be returned from the SSH get method mock result.
 */
export function mockDownloadFiles(
  sshClientMock: DeepMocked<Client>,
  filePaths: string[],
  fileTransformation?: (fileContent: string) => string,
): void {
  const fileInfos = filePaths.map(
    (filePath) => ({ name: filePath } as Client.FileInfo),
  );
  sshClientMock.list.mockResolvedValue(fileInfos);
  sshClientMock.get.mockImplementation((filePath: string) => {
    let fileContent = readFileSync(filePath, {
      encoding: FILE_DEFAULT_ENCODING,
    }).toString();
    if (fileTransformation) {
      fileContent = fileTransformation(fileContent);
    }
    return Promise.resolve(fileContent);
  });
}

/**
 * Represents a file that contains a header, records and a footer.
 */
export interface StructuredFile {
  header: string;
  records: string[];
  footer: string;
}

/**
 * Extracts the file, header and footer from a file.
 * @param fileContent file string to have the header and footer extracted.
 * @returns header, records and footer.
 */
export function getStructuredRecords(fileContent: string): StructuredFile {
  const fileLines = fileContent.split(LINE_BREAK_SPLIT_REGEX);
  const header = fileLines.shift();
  const footer = fileLines.pop();
  return {
    header,
    records: fileLines,
    footer,
  };
}

/**
 * Combine a header, records and a footer into a file content string.
 * @param file header, records and footer to be combined into a file content string.
 * @returns header, records and a footer combined into a file content string.
 */
export function createFileFromStructuredRecords(file: StructuredFile): string {
  return [file.header, ...file.records, file.footer].join(END_OF_LINE);
}
