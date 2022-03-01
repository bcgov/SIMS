/**
 *File Origin type
 File original originated from like 
 Application or Student uploader form. 
 If its Temporary, then the file is uploaded 
 but the file uploaded form is not submitted, 
 when the form is submitted, the file origin is 
 updated from Temporary to the respective file_origin_type';
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
   * File submitted from student uploaded form.
   */
  Student = "Student",
}
