export interface CreateStudentAccountApplicationAPIInDTO {
  submittedData: unknown;
}

export interface StudentAccountApplicationSummaryAPIOutDTO {
  id: number;
  fullName: string;
  submittedDate: string;
}

export interface StudentAccountApplicationAPIOutDTO {
  id: number;
  submittedData: unknown;
}
