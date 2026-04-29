import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  DynamicFormConfiguration,
  DynamicFormType,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeApplication,
  createFakeEducationProgramOffering,
  saveFakeStudent,
} from "@sims/test-utils";
import { ConfigService } from "@sims/utilities/config";
import { DataSource, Repository } from "typeorm";
import { APPLICATION_SUBMISSION_DATA } from "../../constants/application-submission.constants";

/**
 * Expected header name to send the authentication token to the formio API.
 */
const FORMIO_TOKEN_HEADER = "x-jwt-token";
/**
 * Default program year ID used for creating load test applications.
 * Corresponds to the 2023-24 program year.
 */
const DEFAULT_PROGRAM_YEAR_ID = 2;

@Injectable()
export class ApplicationSubmissionService {
  private readonly dataSources: E2EDataSources;
  private readonly dynamicFormConfigRepository: Repository<DynamicFormConfiguration>;
  /**
   * Cached formio authentication token obtained once at setup time.
   */
  private cachedFormioToken: string | null = null;
  /**
   * Cached form definition name obtained once at setup time.
   */
  private cachedFormDefinitionName: string | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.dataSources = createE2EDataSources(dataSource);
    this.dynamicFormConfigRepository =
      dataSource.getRepository(DynamicFormConfiguration);
  }

  /**
   * Create draft applications for load testing. Also warms up the formio
   * token and form definition name caches to avoid per-iteration overhead.
   * @param iterations number of draft applications to create.
   * @returns application IDs.
   */
  async createDraftApplications(iterations: number): Promise<number[]> {
    const student = await saveFakeStudent(this.dataSource);
    const offering = await this.dataSources.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser: student.user }),
    );
    this.cachedFormDefinitionName = await this.getFormDefinitionName(
      DEFAULT_PROGRAM_YEAR_ID,
      OfferingIntensity.fullTime,
    );
    this.cachedFormioToken = await this.fetchFormioToken();
    const applications: Application[] = [];
    for (let i = 0; i < iterations; i++) {
      const application = createFakeApplication(
        {
          student,
          location: offering.institutionLocation,
          applicationEditStatusUpdatedBy: student.user,
        },
        {
          initialValue: {
            data: APPLICATION_SUBMISSION_DATA as ApplicationData,
            offeringIntensity: OfferingIntensity.fullTime,
          },
        },
      );
      applications.push(application);
    }
    await this.dataSources.application.insert(applications);
    return applications.map((app) => app.id);
  }

  /**
   * Submit an application by performing a formio dry-run validation and
   * updating the application status to submitted in the database.
   * @param applicationId application ID.
   */
  async submitApplication(applicationId: number): Promise<void> {
    const application = await this.dataSources.application.findOne({
      where: { id: applicationId },
    });
    const token =
      this.cachedFormioToken ?? (await this.fetchFormioToken());
    const { formsUrl } = this.configService.forms;
    await this.httpService.axiosRef.post(
      `${formsUrl}/${this.cachedFormDefinitionName}/submission?dryRun=1`,
      { data: application.data },
      { headers: { [FORMIO_TOKEN_HEADER]: token } },
    );
    await this.dataSources.application.update(
      { id: applicationId },
      {
        applicationStatus: ApplicationStatus.Submitted,
        submittedDate: new Date(),
      },
    );
  }

  /**
   * Get the form definition name for the given program year and offering intensity
   * from the dynamic form configurations stored in the database.
   * @param programYearId program year ID.
   * @param offeringIntensity offering intensity.
   * @returns form definition name.
   */
  private async getFormDefinitionName(
    programYearId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<string> {
    const formConfig = await this.dynamicFormConfigRepository.findOne({
      where: {
        formType: DynamicFormType.StudentFinancialAidApplication,
        programYear: { id: programYearId },
        offeringIntensity,
      },
      relations: { programYear: true },
    });
    return formConfig?.formDefinitionName ?? "sfaa2023-24";
  }

  /**
   * Fetch a new formio authentication token using the service account credentials.
   * @returns formio JWT token.
   */
  private async fetchFormioToken(): Promise<string> {
    const { formsUrl, serviceAccountCredential } = this.configService.forms;
    const response = await this.httpService.axiosRef.post(
      `${formsUrl}/user/login`,
      {
        data: {
          email: serviceAccountCredential.userName,
          password: serviceAccountCredential.password,
        },
      },
    );
    return response.headers[FORMIO_TOKEN_HEADER];
  }
}
