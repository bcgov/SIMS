ALTER TABLE
	sims.student_files
ADD
	COLUMN deletion_note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_files.deletion_note_id IS 'Note added during student file deletion.';
