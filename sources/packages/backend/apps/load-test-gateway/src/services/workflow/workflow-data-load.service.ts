import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  EducationProgramOffering,
  Student,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import {
  createFakeApplication,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import { APPLICATION_DATA_SINGLE_INDEPENDENT } from "../../utils/application.constants";

interface ApplicationPreliminaryData {
  offering: EducationProgramOffering;
  student: Student;
}

@Injectable()
export class WorkflowDataLoadService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(EducationProgramOffering)
    private readonly offeringRepo: Repository<EducationProgramOffering>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(StudentAssessment)
    private readonly assessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Load the application and assessment data required for the load test.
   * @param dataIterations load test iterations.
   * @returns student assessments.
   */
  async loadApplicationAssessmentData(
    dataIterations: number,
  ): Promise<StudentAssessment[]> {
    const preliminaryData = await this.createApplicationPreliminaryData();
    const applications: Application[] = [];
    for (let i = 1; i <= dataIterations; i++) {
      const submittedApplicationData = {
        ...APPLICATION_DATA_SINGLE_INDEPENDENT,
        selectedOffering: preliminaryData.offering.id,
      };
      const application = createFakeApplication(
        {
          student: preliminaryData.student,
          location: preliminaryData.offering.institutionLocation,
        },
        { initialValue: { data: submittedApplicationData } },
      );
      applications.push(application);
    }
    return this.saveApplicationAssessments(
      applications,
      preliminaryData.offering,
    );
  }

  /**
   * Create preliminary data required to build the iteration of applications.
   * @returns preliminary data.
   */
  private async createApplicationPreliminaryData(): Promise<ApplicationPreliminaryData> {
    const auditUser = await this.userRepo.save(createFakeUser());
    const [offering, student] = await Promise.all([
      this.offeringRepo.save(createFakeEducationProgramOffering({ auditUser })),
      this.studentRepo.save(createFakeStudent()),
    ]);
    return { offering, student };
  }

  /**
   * Save the application and assessment data.
   * @param applications applications.
   * @param offering offering.
   * @returns assessments.
   */
  private async saveApplicationAssessments(
    applications: Application[],
    offering: EducationProgramOffering,
  ): Promise<StudentAssessment[]> {
    await this.applicationRepo.save(applications);
    applications.forEach((application) => {
      const studentAssessment = createFakeStudentAssessment(
        {
          auditUser: application.student.user,
          application,
          offering: offering,
        },
        {
          initialValue: {
            studentAssessmentStatus: StudentAssessmentStatus.Queued,
          },
        },
      );
      application.currentAssessment = studentAssessment;
    });

    const assessments = applications.map((app) => app.currentAssessment);

    await this.assessmentRepo.insert(assessments);

    //Update the current assessment for the applications.
    for (const application of applications) {
      await this.applicationRepo.update(
        { id: application.id },
        { currentAssessment: application.currentAssessment },
      );
    }

    return assessments;
  }
}
