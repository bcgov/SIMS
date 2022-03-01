-- add column
ALTER TABLE
  sims.student_files
ADD
  COLUMN IF NOT EXISTS file_origin sims.file_origin_type NOT NULL DEFAULT 'Temporary';

COMMENT ON COLUMN sims.student_files.file_origin IS 'File originated from, for instance, an Application or Student uploader form. If its Temporary, then the file is uploaded but the file uploaded form is not submitted yet. When the form is submitted, the file origin is updated from Temporary to the respective file_origin_type.';

-- add column
ALTER TABLE
  sims.student_files
ADD
  COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN sims.student_files.metadata IS 'Metadata of the file, eg. if a file is uploaded from student uploader form then the metadata may sometimes have the application number related to the application';