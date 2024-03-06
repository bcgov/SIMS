/**
 *File Origin type
 File originated from, for instance, an Application
 or Student uploader form. If it's Temporary, then
 the file is uploaded but the file uploaded form
 is not submitted yet. When the form is submitted,
 the file origin is updated from Temporary to the
 respective file_origin_type.
 */
export enum FileOriginType {
  /**
   * Temporary is set when file is uploaded but not submitted
   */
  Temporary = "Temporary",
  /**
   * File submitted from FT/PT Application form.
   */
  Application = "Application",
  /**
   * File submitted from student uploader form.
   */
  Student = "Student",
  /**
   * File submitted from the Ministry to the student account.
   */
  Ministry = "Ministry",
  /**
   * File submitted for student appeal.
   */
  Appeal = "Appeal",
}

export interface StudentFileMetadata {
  applicationNumber?: string;
}
