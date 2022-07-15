import { ConfigApi } from "@/services/http/ConfigApi";
import { StudentApi } from "@/services/http/StudentApi";
import { ProgramYearApi } from "@/services/http/ProgramYearApi";
import { UserApi } from "@/services/http/UserApi";
import { InstitutionApi } from "@/services/http/InstitutionApi";
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
import { DesignationAgreementApi } from "@/services/http/DesignationAgreementApi";
import { StudentAppealApi } from "@/services/http/StudentAppealApi";
import { StudentAssessmentApi } from "@/services/http/StudentAssessmentApi";
import { ReportApi } from "@/services/http/ReportApi";
import { ApplicationExceptionApi } from "@/services/http/ApplicationExceptionApi";
import { ScholasticStandingApi } from "@/services/http/ScholasticStandingApi";
import { InstitutionUserApi } from "@/services/http/InstitutionUserApi";

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
  ScholasticStandingApi: new ScholasticStandingApi(),
  InstitutionUserApi: new InstitutionUserApi(),
};

export default ApiClient;
