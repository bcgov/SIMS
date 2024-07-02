CREATE TYPE sims.supplier_status AS ENUM (
  'Pending supplier verification',
  'Pending address verification',
  'Verified',
  'Verified manually'
);