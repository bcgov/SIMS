-- Inserting initial values for 'pir_denied_reason' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration
INSERT INTO pir_denied_reason(reason)
VALUES('School is unable to confirm student identity, please confirm your student number or contact Financial Student Aid Office for more information');

INSERT INTO pir_denied_reason(reason)
VALUES('Study period dates selected are incorrect, please submit an application for each semester individually');

INSERT INTO pir_denied_reason(reason)
VALUES('Programs you are registered in is not eligible for Student Aid BC funding, please contact Financial Aid Office for more information');

INSERT INTO pir_denied_reason(reason)
VALUES('Our records indicate you are not registered, please re-submit application after registration');

INSERT INTO pir_denied_reason(reason)
VALUES('Study period dates are incorrect, please contact Financial Aid Office for more information');

INSERT INTO pir_denied_reason(reason)
VALUES('Other');