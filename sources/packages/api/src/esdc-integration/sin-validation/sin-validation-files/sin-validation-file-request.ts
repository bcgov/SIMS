import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";

/**
 * File request record of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export abstract class SINValidationFileRequest implements FixedFormatFileLine {
  getFixedFormat(): string {
    // TODO: TO be implemented.
    return "";
  }
}
