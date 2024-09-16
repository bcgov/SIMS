import { OptionItemAPIOutDTO } from "@/services/http/dto";

export const INSTITUTION_REPORTS: OptionItemAPIOutDTO[] = [
  {
    description: "Offering Details",
    id: "Offering_Details_Report",
  },
  { description: "Student Unmet Need", id: "Student_Unmet_Need_Report" },
  { description: "COE Requests", id: "COE_Requests" },
];

export const MINISTRY_REPORTS: OptionItemAPIOutDTO[] = [
  { description: "Data Inventory", id: "Data_Inventory_Report" },
  { description: "Disbursements", id: "Disbursement_Report" },
  { description: "eCert Errors", id: "ECert_Errors_Report" },
  {
    description: "Forecast disbursements",
    id: "Disbursement_Forecast_Report",
  },
  {
    description: "Institution Designation",
    id: "Institution_Designation_Report",
  },
  {
    description: "Program and Offering Status",
    id: "Program_And_Offering_Status_Report",
  },
  {
    description: "Student Unmet Need",
    id: "Ministry_Student_Unmet_Need_Report",
  },
];
