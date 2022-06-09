import { ConfigApi } from "@/services/http/ConfigApi";
import { StudentApi } from "@/services/http/StudentApi";
import { ProgramYearApi } from "@/services/http/ProgramYearApi";
import { UserApi } from "@/services/http/UserApi";
import { InstitutionApi } from "@/services/http/Institution";
import { DynamicFormsApi } from "@/services/http/DynamicForms";
import { WorkflowApi } from "@/services/http/WorkflowApi";
import { ApplicationApi } from "@/services/http/ApplicationApi";
import { InstitutionLocationApi } from "@/services/http/InstitutionLocation";
import { EducationProgramApi } from "@/services/http/EducationProgramApi";
import { EducationProgramOfferingApi } from "@/services/http/EducationProgramOfferingApi";
import { FileUploadApi } from "@/services/http/FileUploadApi";
import { ProgramInfoRequestApi } from "@/services/http/ProgramInfoRequestApi";
import { ConfirmationOfEnrollmentApi } from "@/services/http/ConfirmationOfEnrollmentApi";
import { SupportingUserApi } from "@/services/http/SupportingUserApi";
import { NoteApi } from "@/services/http/NoteApi";
import { RestrictionApi } from "@/services/http/RestrictionApi";
import { DesignationAgreementApi } from "./DesignationAgreementApi";
import { StudentAppealApi } from "./StudentAppealApi";
import { StudentAssessmentApi } from "./StudentAssessmentApi";
import { ReportApi } from "./ReportApi";
import { ApplicationExceptionApi } from "./ApplicationExceptionApi";

const ApiClient = {
  Configs: new ConfigApi(),
  Students: new StudentApi(),
  ProgramYear: new ProgramYearApi(),
  User: new UserApi(),
  Institution: new InstitutionApi(),
  DynamicForms: new DynamicFormsApi(),
  Workflow: new WorkflowApi(),
  Application: new ApplicationApi(),
  InstitutionLocation: new InstitutionLocationApi(),
  EducationProgram: new EducationProgramApi(),
  EducationProgramOffering: new EducationProgramOfferingApi(),
  FileUpload: new FileUploadApi(),
  ProgramInfoRequest: new ProgramInfoRequestApi(),
  ConfirmationOfEnrollment: new ConfirmationOfEnrollmentApi(),
  SupportingUserApi: new SupportingUserApi(),
  NoteApi: new NoteApi(),
  RestrictionApi: new RestrictionApi(),
  DesignationAgreement: new DesignationAgreementApi(),
  StudentAppealApi: new StudentAppealApi(),
  StudentAssessmentApi: new StudentAssessmentApi(),
  ReportApi: new ReportApi(),
  ApplicationExceptionApi: new ApplicationExceptionApi(),
};

export default ApiClient;
