import { Injectable } from "@nestjs/common";
import { Brackets, DataSource, EntityManager, Not, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  DisbursementValueType,
  OfferingIntensity,
  SFASApplication,
  SFASPartTimeApplications,
  StudentAppeal,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import {
  AwardTotal,
  ProgramYearWorkflowOutputTotal,
  ProgramYearTotal,
  SequencedApplications,
  SequentialApplication,
} from "..";
import { InjectRepository } from "@nestjs/typeorm";
import { getISODateOnlyString } from "@sims/utilities";
import {
  WorkflowOutputType,
  StudentAssessmentDetail,
} from "./student-assessment.model";

@Injectable()
export class AssessmentSequentialProcessingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
    @InjectRepository(SFASApplication)
    private readonly sfasApplicationsRepo: Repository<SFASApplication>,
    @InjectRepository(SFASPartTimeApplications)
    private readonly sfasPartTimeApplicationsRepo: Repository<SFASPartTimeApplications>,
    @InjectRepository(DisbursementValue)
    private readonly disbursementValueRepo: Repository<DisbursementValue>,
  ) {}

  /**
   * Checks if changes in an assessment can potentially causes changes in another application
   * which would demand a reassessment of the same.
   * @param assessmentId assessment currently changing (e.g. updated or cancelled).
   * @param auditUserId user that should be considered the one that is causing the changes.
    @param entityManager used to execute the commands in the same transaction.
   * @returns impacted application if any, otherwise null.
   */
  async assessImpactedApplicationReassessmentNeeded(
    assessmentId: number,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Application | null> {
    const applicationRepo = entityManager.getRepository(Application);
    // Application which current assessment is the assessmentId to be checked.
    // If the assessment id is not associated with the current application's assessment
    // no need to check for impacts on future applications.
    const application = await applicationRepo.findOne({
      select: {
        id: true,
        applicationNumber: true,
        programYear: {
          id: true,
        },
        student: {
          id: true,
        },
        currentAssessment: {
          id: true,
          studentAppeal: { id: true },
        },
      },
      relations: {
        student: true,
        programYear: true,
        currentAssessment: { studentAppeal: true },
      },
      where: {
        applicationStatus: Not(ApplicationStatus.Overwritten),
        currentAssessment: {
          id: assessmentId,
        },
      },
    });
    if (!application) {
      // Assessment is not current one or the application is overwritten.
      return null;
    }
    const sequencedApplications = await this.getSequencedApplications(
      application.applicationNumber,
      application.student.id,
      application.programYear.id,
      { entityManager },
    );
    if (!sequencedApplications.future.length) {
      // There are no future applications impacted.
      return null;
    }
    // Create the reassessment for the next impacted application.
    const [futureSequencedApplication] = sequencedApplications.future;
    const impactedApplication = new Application();
    impactedApplication.id = futureSequencedApplication.applicationId;
    const now = new Date();
    // Create the new assessment to be processed.
    const auditUser = { id: auditUserId } as User;
    impactedApplication.modifier = auditUser;
    impactedApplication.updatedAt = now;
    impactedApplication.currentAssessment = {
      application: {
        id: impactedApplication.id,
      } as Application,
      offering: {
        id: futureSequencedApplication.currentAssessmentOfferingId,
      },
      triggerType: AssessmentTriggerType.RelatedApplicationChanged,
      relatedApplicationAssessment: { id: assessmentId } as StudentAssessment,
      creator: auditUser,
      createdAt: now,
      submittedBy: auditUser,
      submittedDate: now,
    } as StudentAssessment;
    // Update the student appeal record for the student assessment if it exists.
    if (futureSequencedApplication.currentAssessmentAppealId) {
      impactedApplication.currentAssessment.studentAppeal = {
        id: futureSequencedApplication.currentAssessmentAppealId,
      } as StudentAppeal;
    }
    return applicationRepo.save(impactedApplication);
  }

  /**
   * Get the program year awards totals workflow outputs totals for the assessment.
   * @param assessmentId assessment id.
   * @param options method options.
   * - `alternativeReferenceDate` the reference date to be used.
   * @returns the promise to get the program year totals.
   */
  async getProgramYearTotals(
    assessmentId: number,
    options?: {
      alternativeReferenceDate?: Date;
    },
  ): Promise<ProgramYearTotal> {
    // Get the current assessment from the assessment id.
    const currentAssessment = await this.getCurrentAssessment(assessmentId);
    const offeringIntensity = currentAssessment.offering.offeringIntensity;
    // The chronology of the applications is defined by the method {@link getSequencedApplications}.
    // Only the current assessment awards are considered since it must reflect the most updated
    // workflow calculated values.
    const sequencedApplications = await this.getSequencedApplications(
      currentAssessment.application.applicationNumber,
      currentAssessment.application.student.id,
      currentAssessment.application.programYear.id,
      { alternativeReferenceDate: options?.alternativeReferenceDate },
    );
    // Get the application numbers of the previous applications.
    const applicationNumbers = sequencedApplications.previous.map(
      (application) => application.applicationNumber,
    );
    // Only get the full-time workflow output totals if the offering intensity is full-time.
    const shouldGetProgramYearWorkflowOutputTotals =
      OfferingIntensity.fullTime === offeringIntensity &&
      !!applicationNumbers?.length;
    const [awardTotals, workflowOutputTotals] = await Promise.all([
      // Get the program year awards totals for part-time and full-time.
      this.getProgramYearPreviousAwardsTotals(
        sequencedApplications,
        currentAssessment,
        options,
      ),
      shouldGetProgramYearWorkflowOutputTotals
        ? this.getProgramYearWorkflowOutputTotals(applicationNumbers)
        : null,
    ]);
    return {
      awardTotals,
      workflowOutputTotals,
    };
  }

  /**
   * Returns the sum of all awards associated with non-overwritten applications.
   * Only pending awards or already sent awards will be considered.
   * Only federal and provincial grants are considered.
   * Grants that are common between part-time and full-time (e.g. CSGP, SBSD) applications will have
   * their totals calculated per intensity, which means that if the student has a part-time
   * and a full-time application in the same year and both have a CSGP grant, its totals will
   * be individually calculated and returned.
   * @param sequencedApplications sequenced applications for the current application.
   * @param assessment assessment currently changing.
   * - `alternativeReferenceDate` date that should be used to determine the order when the
   * @returns list of existing awards and their totals, if any, otherwise it returns an empty array,
   * for instance, if the application is the first application or the only application for the
   * program year.
   */
  private async getProgramYearPreviousAwardsTotals(
    sequencedApplications: SequencedApplications,
    assessment: StudentAssessment,
    options?: { alternativeReferenceDate?: Date },
  ): Promise<AwardTotal[]> {
    // Get the first assessment date ever calculated for the current application.
    // If there are multiple assessments for the current application, then set the
    // first assessment date to the assessment date of the first assessment.
    // If this is the first ever assessment for the student in the given program year,
    // then the assessment date has not been set and use the provided alternative reference date.
    const referenceAssessmentDate =
      sequencedApplications.current.referenceAssessmentDate ??
      options?.alternativeReferenceDate;
    // Convert the reference assessment date to an ISO date format.
    const formattedReferenceAssessmentDate = getISODateOnlyString(
      referenceAssessmentDate,
    );
    const programYearStartDate = assessment.application.programYear.startDate;
    const [sfasAwardsTotals, sfasPartTimeAwardsTotals] = await Promise.all([
      this.getProgramYearSFASAwardsTotals(
        assessment.application.student.id,
        programYearStartDate,
        formattedReferenceAssessmentDate,
      ),
      this.getProgramYearSFASPartTimeAwardsTotals(
        assessment.application.student.id,
        programYearStartDate,
        formattedReferenceAssessmentDate,
      ),
    ]);
    if (!sequencedApplications.previous.length) {
      // There are no past applications. Return SFAS full-time and part-time awards if there are any.
      return [...sfasAwardsTotals, ...sfasPartTimeAwardsTotals];
    }
    const applicationNumbers = sequencedApplications.previous.map(
      (application) => application.applicationNumber,
    );
    const totals = await this.disbursementValueRepo
      .createQueryBuilder("disbursementValue")
      .select("disbursementValue.valueCode", "valueCode")
      .addSelect("offering.offeringIntensity", "offeringIntensity")
      // When obtaining the SUM of a given grant, calculate the value from effective_amount of disbursement_values when effective_amount is present
      // or in other words disbursement is Sent
      // and if the value is not present in effective_amount which means the disbursement has not been calculated for e-cert
      // then use a forecast value which is (value_amount - disbursed_amount_subtracted) which could potentially be sent to the student.

      // The consideration of overawards has been excluded while calculating the PY SUM value for any grant
      // as the overawards are applicable only for the loans and NOT for the grants.
      .addSelect(
        "SUM(COALESCE(disbursementValue.effectiveAmount, disbursementValue.valueAmount - COALESCE(disbursementValue.disbursedAmountSubtracted, 0)))",
        "total",
      )
      .innerJoin(
        "disbursementValue.disbursementSchedule",
        "disbursementSchedule",
      )
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("studentAssessment.application", "application")
      .where("application.applicationNumber IN (:...applicationNumbers)", {
        applicationNumbers,
      })
      // Overwritten application can have awards associated with and they should not be considered.
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.Overwritten,
      })
      // Only consider disbursements in Pending, ReadyToSend, or Sent.
      .andWhere(
        "disbursementSchedule.disbursementScheduleStatus IN (:...payableDisbursementScheduleStatus)",
        {
          payableDisbursementScheduleStatus: [
            DisbursementScheduleStatus.Pending,
            DisbursementScheduleStatus.ReadyToSend,
            DisbursementScheduleStatus.Sent,
          ],
        },
      )
      // Ensures that only grants will be returned since loans and not needed.
      .andWhere("disbursementValue.valueType IN (:...grantsValueTypes)", {
        grantsValueTypes: [
          DisbursementValueType.CanadaGrant,
          DisbursementValueType.BCGrant,
        ],
      })
      .groupBy("disbursementValue.valueCode")
      .addGroupBy("offering.offeringIntensity")
      .getRawMany<{
        offeringIntensity: OfferingIntensity;
        valueCode: string;
        total: string;
      }>();
    // Parses the values from DB ensuring that the total will be properly converted to a number.
    // The valueAmount from awards are mapped to string by Typeorm Postgres driver.
    const disbursementTotals = totals.map((total) => ({
      offeringIntensity: total.offeringIntensity,
      valueCode: total.valueCode,
      total: +total.total,
    }));
    return [
      ...disbursementTotals,
      ...sfasAwardsTotals,
      ...sfasPartTimeAwardsTotals,
    ];
  }

  /**
   * Gets program year workflow output totals for the provided application numbers.
   * @param applicationNumbers application numbers.
   * @returns program year workflow output totals.
   */
  private async getProgramYearWorkflowOutputTotals(
    applicationNumbers: string[],
  ): Promise<ProgramYearWorkflowOutputTotal[]> {
    const totals = await this.applicationRepo
      .createQueryBuilder("application")
      .select(
        "SUM((currentAssessment.workflowData -> 'calculatedData' ->> 'totalFederalFSC')::NUMERIC)",
        WorkflowOutputType.FederalFSC,
      )
      .addSelect(
        "SUM((currentAssessment.workflowData -> 'calculatedData' ->> 'totalProvincialFSC')::NUMERIC)",
        WorkflowOutputType.ProvincialFSC,
      )
      .addSelect(
        "SUM((currentAssessment.workflowData -> 'calculatedData' ->> 'exemptScholarshipsBursaries')::NUMERIC)",
        WorkflowOutputType.ScholarshipsBursaries,
      )
      .addSelect(
        "SUM((currentAssessment.workflowData -> 'calculatedData' ->> 'studentSpouseContributionWeeks')::NUMERIC)",
        WorkflowOutputType.SpouseContributionWeeks,
      )
      .addSelect(
        "SUM((currentAssessment.workflowData -> 'calculatedData' ->> 'totalBookCost')::NUMERIC)",
        WorkflowOutputType.BookCost,
      )
      .addSelect(
        "SUM((currentAssessment.workflowData -> 'calculatedData' ->> 'returnTransportationCost')::NUMERIC)",
        WorkflowOutputType.ReturnTransportationCost,
      )
      .innerJoin("application.currentAssessment", "currentAssessment")
      .where("application.applicationNumber IN (:...applicationNumbers)", {
        applicationNumbers,
      }) // Overwritten application can have awards associated with and they should not be considered.
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.Overwritten,
      })
      // Check for assessment completed status to avoid retrieving any cancellation status.
      .andWhere(
        "currentAssessment.studentAssessmentStatus = :completedStudentAssessmentStatus",
        {
          completedStudentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      )
      .getRawOne<{
        [WorkflowOutputType.FederalFSC]: string;
        [WorkflowOutputType.ProvincialFSC]: string;
        [WorkflowOutputType.ScholarshipsBursaries]: string;
        [WorkflowOutputType.SpouseContributionWeeks]: string;
        [WorkflowOutputType.BookCost]: string;
        [WorkflowOutputType.ReturnTransportationCost]: string;
      }>();

    return Object.keys(WorkflowOutputType).map((key) => ({
      workflowOutput: key as WorkflowOutputType,
      total: +totals[key] || 0,
    }));
  }

  /**
   * Gets the current assessment for the provided assessment id.
   * @param assessmentId assessment id.
   * @returns current assessment.
   */
  private async getCurrentAssessment(
    assessmentId: number,
  ): Promise<StudentAssessment> {
    const currentAssessment = await this.studentAssessmentRepo.findOne({
      select: {
        id: true,
        application: {
          id: true,
          applicationNumber: true,
          student: {
            id: true,
            birthDate: true,
            sinValidation: {
              sin: true,
            },
            user: {
              lastName: true,
            },
          },
          programYear: {
            id: true,
            startDate: true,
          },
        },
        offering: {
          id: true,
          offeringIntensity: true,
        },
        assessmentDate: true,
      },
      relations: {
        application: {
          student: { sinValidation: true, user: true },
          programYear: true,
        },
        offering: true,
      },
      where: {
        id: assessmentId,
      },
    });
    if (!currentAssessment) {
      throw new Error(`Assessment id ${assessmentId} not found.`);
    }
    return currentAssessment;
  }

  /**
   * Get the application correspondent to the {@link applicationNumber} as the current to then search
   * for applications in the past and in the future for the same student and the same program year.
   * If a reference date is not possible to be determined for the current application so no future
   * or past applications will be returned.
   * @param applicationNumber reference application to be used to determined past and future
   * applications and the one to be considered as current for the {@link SequencedApplications}.
   * @param studentId student id.
   * @param programYearId program id to be considered.
   * @param options method options.
   * - `entityManager` used to execute the commands in the same transaction.
   * - `alternativeReferenceDate` date that should be used to determine the order when the
   * {@link applicationNumber} used as reference does not have a calculated date yet.
   * @returns sequenced applications.
   */
  private async getSequencedApplications(
    applicationNumber: string,
    studentId: number,
    programYearId: number,
    options?: {
      entityManager?: EntityManager;
      alternativeReferenceDate?: Date;
    },
  ): Promise<SequencedApplications> {
    const entityManager = options?.entityManager ?? this.dataSource.manager;
    // Sub query to get the first assessment calculation date for an application to be used for ordering.
    // All applications versions should be considered, which means 'Overwritten' also.
    // This will ensure that once the application is calculated for the first time its
    // order in the sequence will never change.
    const assessmentDateSubQuery = entityManager
      .getRepository(StudentAssessment)
      .createQueryBuilder("assessment")
      .select("assessment.assessmentDate")
      .innerJoin("assessment.application", "subQueryApplication")
      .where(
        "subQueryApplication.applicationNumber = application.applicationNumber",
      )
      .orderBy("assessment.assessmentDate")
      .limit(1)
      .getQuery();
    // Sub query to determine if the application has at least one payable disbursement.
    // If all the disbursements from the application are NOT payable then the application will not be considered for sequential processing.
    const existsValidDisbursement = entityManager
      .getRepository(DisbursementSchedule)
      .createQueryBuilder("disbursementSchedule")
      .select("1")
      .innerJoin(
        "disbursementSchedule.studentAssessment",
        "disbursementAssessment",
      )
      .innerJoin(
        "disbursementAssessment.application",
        "disbursementApplication",
      )
      .where("disbursementApplication.id = application.id")
      .andWhere(
        "disbursementSchedule.disbursementScheduleStatus IN (:...payableDisbursementStatuses)",
      )
      .limit(1)
      .getSql();
    // Returns past, current, and future applications ordered by the first ever executed assessment calculation.
    const referenceAssessmentDateColumn = "referenceAssessmentDate";
    const sequentialApplications = await entityManager
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("application.id", "applicationId")
      .addSelect("application.applicationNumber", "applicationNumber")
      .addSelect("application.applicationStatus", "applicationStatus")
      .addSelect("currentAssessmentOffering.id", "currentAssessmentOfferingId")
      .addSelect("currentAssessmentAppeal.id", "currentAssessmentAppealId")
      .addSelect(`(${assessmentDateSubQuery})`, referenceAssessmentDateColumn)
      .innerJoin("application.student", "student")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "currentAssessmentOffering")
      .leftJoin("currentAssessment.studentAppeal", "currentAssessmentAppeal")
      .where("student.id = :studentId", { studentId })
      .andWhere("programYear.id = :programYearId", { programYearId })
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.Overwritten,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            // Conditions to find applications considered before the current application and after.
            // 1. Application should not be cancelled;
            // 2. Current assessment must have a date would indicates that it was calculated.
            // 3. At least one COE must be valid.
            new Brackets((pastOrFutureBracket) =>
              pastOrFutureBracket
                .where("application.applicationStatus != :cancelledStatus", {
                  cancelledStatus: ApplicationStatus.Cancelled,
                })
                .andWhere("currentAssessment.assessmentDate IS NOT NULL")
                .andWhere(`EXISTS (${existsValidDisbursement})`),
            ),
            // The 'or' condition forces the current application to be returned since its data matters for decisions,
            // for instance, if the current application has no calculation date no future application should be impacted.
          ).orWhere("application.applicationNumber = :applicationNumber", {
            applicationNumber,
          });
        }),
      )
      .setParameters({
        payableDisbursementStatuses: [
          DisbursementScheduleStatus.Pending,
          DisbursementScheduleStatus.ReadyToSend,
          DisbursementScheduleStatus.Sent,
        ],
      })
      .orderBy(`"${referenceAssessmentDateColumn}"`)
      .getRawMany<SequentialApplication>();
    return new SequencedApplications(
      applicationNumber,
      sequentialApplications,
      options?.alternativeReferenceDate,
    );
  }

  /**
   * Get SFAS application awards totals.
   * @param studentId student id.
   * @param programYearStartDate: the start date of the program year.
   * @param referenceAssessmentDate  date of the first assessment date of the current application.
   * @returns SFAS application awards totals.
   */
  private async getProgramYearSFASAwardsTotals(
    studentId: number,
    programYearStartDate: string,
    referenceAssessmentDate: string,
  ): Promise<AwardTotal[]> {
    const sfasApplicationAwards = this.sfasApplicationsRepo
      .createQueryBuilder("sfasApplication")
      .select("SUM(sfasApplication.csgpAward)", "CSGP")
      .addSelect("SUM(sfasApplication.sbsdAward)", "SBSD")
      .addSelect("SUM(sfasApplication.csgdAward)", "CSGD")
      .addSelect("SUM(sfasApplication.bcagAward)", "BCAG")
      .innerJoin("sfasApplication.individual", "sfasIndividual")
      .where("sfasApplication.applicationCancelDate IS NULL")
      .andWhere("sfasIndividual.student.id = :studentId", { studentId })
      .andWhere("sfasApplication.startDate >= :startDate", {
        startDate: programYearStartDate,
      })
      .andWhere("sfasApplication.startDate < :referenceAssessmentDate", {
        referenceAssessmentDate,
      });
    const awards = await sfasApplicationAwards.getRawOne<
      Record<"CSGP" | "SBSD" | "CSGD" | "BCAG", string>
    >();
    const totals: AwardTotal[] = [];
    Object.entries(awards).forEach(([key, value]) => {
      if (value && +value > 0) {
        totals.push({
          offeringIntensity: OfferingIntensity.fullTime,
          valueCode: key,
          total: +value,
        });
      }
    });
    return totals;
  }

  /**
   * Get SFAS part-time application awards totals.
   * @param studentId student id.
   * @param programYearStartDate: the start date of the program year.
   * @param referenceAssessmentDate  date of the first assessment date of the current application.
   * @returns SFAS application part-time awards totals.
   */
  private async getProgramYearSFASPartTimeAwardsTotals(
    studentId: number,
    programYearStartDate: string,
    referenceAssessmentDate: string,
  ): Promise<AwardTotal[]> {
    const sfasPartTimeApplicationAwards = this.sfasPartTimeApplicationsRepo
      .createQueryBuilder("sfasPTApplication")
      .select("SUM(sfasPTApplication.csgpAward)", "CSGP")
      .addSelect("SUM(sfasPTApplication.sbsdAward)", "SBSD")
      .addSelect("SUM(sfasPTApplication.csgdAward)", "CSGD")
      .addSelect("SUM(sfasPTApplication.bcagAward)", "BCAG")
      .addSelect("SUM(sfasPTApplication.csptAward)", "CSPT")
      .innerJoin("sfasPTApplication.individual", "sfasIndividual")
      .where("sfasPTApplication.applicationCancelDate IS NULL")
      .andWhere("sfasIndividual.student.id = :studentId", { studentId })
      .andWhere("sfasPTApplication.startDate >= :startDate", {
        startDate: programYearStartDate,
      })
      .andWhere("sfasPTApplication.startDate < :referenceAssessmentDate", {
        referenceAssessmentDate,
      });
    const awards = await sfasPartTimeApplicationAwards.getRawOne<
      Record<"CSGP" | "SBSD" | "CSGD" | "BCAG" | "CSPT", string>
    >();
    const totals: AwardTotal[] = [];
    Object.entries(awards).forEach(([key, value]) => {
      if (value && +value > 0) {
        totals.push({
          offeringIntensity: OfferingIntensity.partTime,
          valueCode: key,
          total: +value,
        });
      }
    });
    return totals;
  }

  /**
   * Get first outstanding student assessment to be calculated
   * in the order of original assessment study start date.
   * @param studentId student id.
   * @param programYearId program year id.
   * @returns student assessment to be calculated.
   */
  async getOutstandingAssessmentsForStudentInSequence(
    studentId: number,
    programYearId: number,
  ): Promise<StudentAssessmentDetail> {
    const originalAssessmentStudyStartDateAlias =
      "originalAssessmentStudyStartDate";
    // Sub query to get the original assessment study start date of a given assessment's application.
    const originalAssessmentDateSubQuery = this.studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select("offering.studyStartDate")
      .innerJoin("studentAssessment.offering", "offering")
      .where("studentAssessment.application.id = assessment.application.id")
      .andWhere("studentAssessment.triggerType = :triggerType")
      .limit(1)
      .getSql();

    return (
      this.studentAssessmentRepo
        .createQueryBuilder("assessment")
        .select("assessment.id", "id")
        .addSelect(
          `(${originalAssessmentDateSubQuery})`,
          originalAssessmentStudyStartDateAlias,
        )
        .innerJoin("assessment.application", "application")
        .where(
          "assessment.studentAssessmentStatus NOT IN (:...studentAssessmentStatus)",
        )
        // Exclude the assessments which are waiting for PIR confirmation
        // as they do not have a confirmed study start date.
        .andWhere("assessment.offering IS NOT NULL")
        .andWhere("application.student.id = :studentId")
        .andWhere("application.programYear.id = :programYearId")
        .setParameter("triggerType", AssessmentTriggerType.OriginalAssessment)
        .setParameter("studentAssessmentStatus", [
          StudentAssessmentStatus.Completed,
          StudentAssessmentStatus.CancellationRequested,
          StudentAssessmentStatus.CancellationQueued,
          StudentAssessmentStatus.Cancelled,
        ])
        .setParameter("studentId", studentId)
        .setParameter("programYearId", programYearId)
        .orderBy(`"${originalAssessmentStudyStartDateAlias}"`)
        .addOrderBy("assessment.createdAt")
        .limit(1)
        .getRawOne<StudentAssessmentDetail>()
    );
  }
}
