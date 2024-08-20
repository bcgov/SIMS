export interface ApplicationChangesReport {
  "Application Number": string;
  "Student SIN": string;
  "Student First Name": string;
  "Student Last Name": string;
  "Loan Type": "FT" | "PT";
  "Education Institution Code": string;
  "Original Study Start Date": string;
  "Original Study End Date": string;
  Activity: "Early Withdrawal" | "Reassessment";
  "Activity Time": string;
  "New Study Start Date": string;
  "New Study End Date": string;
}
