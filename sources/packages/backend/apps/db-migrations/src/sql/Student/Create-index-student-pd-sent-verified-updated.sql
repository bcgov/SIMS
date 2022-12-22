CREATE INDEX student_pd_sent_verified_updated ON sims.students(
    pd_date_sent,
    pd_verified,
    pd_date_update
);