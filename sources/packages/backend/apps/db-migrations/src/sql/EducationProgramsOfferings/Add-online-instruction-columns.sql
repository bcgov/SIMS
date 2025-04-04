ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN online_instruction_mode VARCHAR(50),
ADD
    COLUMN is_online_duration_same_always VARCHAR(3),
ADD
    COLUMN total_online_duration SMALLINT,
ADD
    COLUMN minimum_online_duration SMALLINT,
ADD
    COLUMN maximum_online_duration SMALLINT;

COMMENT ON COLUMN sims.education_programs_offerings.online_instruction_mode IS 'Offering mode(s) of online instruction.';

COMMENT ON COLUMN sims.education_programs_offerings.is_online_duration_same_always IS 'Specifies if the blended offering will always be provided with the same total duration of online delivery.';

COMMENT ON COLUMN sims.education_programs_offerings.total_online_duration IS 'Percentage of total duration that will be provided by online delivery in the blended offering.';

COMMENT ON COLUMN sims.education_programs_offerings.minimum_online_duration IS 'Percentage of minimum duration that will be provided by online delivery in the blended offering.';

COMMENT ON COLUMN sims.education_programs_offerings.maximum_online_duration IS 'Percentage of maximum duration that will be provided by online delivery in the blended offering.';