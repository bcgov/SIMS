import { Injectable } from "@nestjs/common";
import {
  Student,
  SFASIndividual,
  ApplicationStatus,
  FullTimeAssessment,
  DisbursementScheduleStatus,
  SFASApplication,
  Application,
} from "@sims/sims-db";
import {
  ApplicationDetailsAPIOutDTO,
  StudentSearchDetails,
} from "./models/student-external-search.dto";
import {
  getISODateOnlyString,
  getTotalDisbursementAmountFromSchedules,
} from "@sims/utilities";

@Injectable()
export class StudentExternalControllerService {
  /**
   * Transform student search result.
   * @param student student.
   * @param sfasIndividual sfas individual.
   * @returns student search result.
   */
  transformStudentSearchResult(
    student?: Student,
    sfasIndividual?: SFASIndividual,
  ): StudentSearchDetails {
    // If the student is found in SIMS, return the student details.
    // Otherwise, return the legacy student details.
    return student
      ? this.transformStudentDetails(student)
      : this.transformLegacyStudentDetails(sfasIndividual);
  }

  /**
   * Transform student application search result.
   * @param studentApplications student applications.
   * @param legacyStudentApplications legacy student applications.
   * @returns student application search result.
   */
  transformApplicationSearchResult(
    studentApplications?: Application[],
    legacyStudentApplications?: SFASApplication[],
  ): ApplicationDetailsAPIOutDTO[] {
    const applications: ApplicationDetailsAPIOutDTO[] = [];
    if (studentApplications?.length) {
      // Transform application details for search result.
      for (const application of studentApplications) {
        applications.push(this.transformApplicationDetails(application));
      }
    }
    if (legacyStudentApplications?.length) {
      // Transform legacy application details for search result.
      for (const application of legacyStudentApplications) {
        applications.push(this.transformLegacyApplicationDetails(application));
      }
    }
    return applications;
  }
  /**
   * Transform to student details.
   * @param student student.
   * @returns student details.
   */
  private transformStudentDetails(student: Student): StudentSearchDetails {
    return {
      isLegacy: false,
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      sin: student.sinValidation.sin,
      birthDate: student.birthDate,
      phoneNumber: student.contactInfo.phone,
      address: {
        addressLine1: student.contactInfo.address.addressLine1,
        addressLine2: student.contactInfo.address.addressLine2,
        city: student.contactInfo.address.city,
        provinceState: student.contactInfo.address.provinceState,
        country: student.contactInfo.address.country,
        postalCode: student.contactInfo.address.postalCode,
      },
    };
  }

  /**
   * Transform sfas individual to student details.
   * @param student student.
   * @returns student details.
   */
  private transformLegacyStudentDetails(
    sfasIndividual: SFASIndividual,
  ): StudentSearchDetails {
    return {
      isLegacy: true,
      givenNames: sfasIndividual.firstName,
      lastName: sfasIndividual.lastName,
      sin: sfasIndividual.sin,
      birthDate: sfasIndividual.birthDate,
      phoneNumber: sfasIndividual.phoneNumber?.toString(),
      address: {
        addressLine1: sfasIndividual.addressLine1,
        addressLine2: sfasIndividual.addressLine2,
        city: sfasIndividual.city,
        provinceState: sfasIndividual.provinceState,
        country: sfasIndividual.country,
        postalCode: sfasIndividual.postalZipCode,
      },
    };
  }

  /**
   * Transform application details.
   * @param application application.
   * @returns application details.
   */
  private transformApplicationDetails(
    application: Application,
  ): ApplicationDetailsAPIOutDTO {
    const assessment = application.currentAssessment;
    const scholasticStanding = assessment.studentScholasticStanding;
    const assessmentData = assessment.assessmentData as FullTimeAssessment;
    const workflowData = assessment.workflowData;
    const offering = assessment.offering;
    const institutionLocation = application.location;

    return {
      isLegacy: false,
      applicationNumber: application.applicationNumber,
      applicationStatus: application.applicationStatus,
      cancelDate:
        application.applicationStatus === ApplicationStatus.Cancelled
          ? getISODateOnlyString(application.applicationStatusUpdatedOn)
          : null,
      withdrawalDate: scholasticStanding?.submittedData?.dateOfWithdrawal,
      withdrawalReason: scholasticStanding?.changeType,
      immigrationStatus: workflowData.studentData.citizenship,
      bcResidency: workflowData.studentData.bcResident,
      maritalStatus: workflowData.studentData.relationshipStatus,
      income: workflowData.studentData.taxReturnIncome,
      livingArrangement: ["SDA", "SIA"].includes(
        workflowData.dmnValues.livingCategory,
      )
        ? "Away"
        : "Home",
      estimatedTotalAward: getTotalDisbursementAmountFromSchedules(
        assessment.disbursementSchedules,
      ),
      dependants: application.data?.dependants?.map(
        (dependant: { fullName: string; dateOfBirth: string }) => ({
          fullName: dependant.fullName,
          birthDate: dependant.dateOfBirth,
        }),
      ),
      program: {
        startDate: offering.studyStartDate,
        endDate: offering.studyEndDate,
        lengthInWeeks: offering.studyBreaks.totalFundedWeeks,
        courseLoad: "FT",
      },
      institution: {
        locationCode: institutionLocation.institutionCode,
        locationName: institutionLocation.name,
        primaryContactFirstName: institutionLocation.primaryContact.firstName,
        primaryContactLastName: institutionLocation.primaryContact.lastName,
        primaryContactEmail: institutionLocation.primaryContact.email,
        primaryContactPhone: institutionLocation.primaryContact.phone,
      },
      costs: {
        tuition: assessmentData.tuitionCost,
        booksAndSupplies: assessmentData.booksAndSuppliesCost,
        exceptionalExpenses: assessmentData.exceptionalEducationCost,
        livingAllowance: assessmentData.livingAllowance,
        secondResidence: assessmentData.secondResidenceCost,
        childCare: assessmentData.childcareCost,
        alimony: assessmentData.alimonyOrChildSupport,
        totalTransportation: assessmentData.transportationCost,
        totalNeed: assessmentData.provincialAssessmentNeed,
      },
      disbursements: assessment.disbursementSchedules.flatMap(
        (disbursement) => {
          return disbursement.disbursementValues.map((disbursementValue) => ({
            awardCode: disbursementValue.valueCode,
            awardAmount:
              disbursement.disbursementScheduleStatus ===
              DisbursementScheduleStatus.Sent
                ? disbursementValue.effectiveAmount
                : disbursementValue.valueAmount,
            fundingDate: disbursement.disbursementDate,
            requestDate: getISODateOnlyString(disbursement.dateSent),
          }));
        },
      ),
    };
  }
  /**
   * Transform legacy application details.
   * @param application legacy application.
   * @returns legacy application details.
   */
  private transformLegacyApplicationDetails(
    application: SFASApplication,
  ): ApplicationDetailsAPIOutDTO {
    return {
      isLegacy: true,
      applicationNumber: application.applicationNumber?.toString(),
      applicationStatus: application.applicationStatusCode,
      cancelDate: application.applicationCancelDate,
      withdrawalDate: application.withdrawalDate,
      withdrawalReason: application.withdrawalReason,
      withdrawalActiveFlag: application.withdrawalActiveFlag,
      bcResidency: application.bcResidencyFlag,
      legacyPermanentResident: application.permanentResidencyFlag,
      maritalStatus: application.maritalStatus,
      legacyMaritalDate: application.marriageDate,
      income: application.grossIncomePreviousYear,
      livingArrangement:
        application.livingArrangements === "Y" ? "Home" : "Away",
      estimatedTotalAward: this.getLegacyTotalEstimatedAward(application),
      dependants: application.dependants?.map((dependant) => ({
        fullName: dependant.dependantName,
        birthDate: dependant.dependantBirthDate,
      })),
      program: {
        startDate: application.startDate,
        endDate: application.endDate,
        lengthInWeeks: application.educationPeriodWeeks,
        courseLoad: application.courseLoad?.toString(),
      },
      institution: {
        locationCode: application.institutionCode,
        locationName: application.institutionLocation?.name,
        primaryContactFirstName:
          application.institutionLocation?.primaryContact?.firstName,
        primaryContactLastName:
          application.institutionLocation?.primaryContact?.lastName,
        primaryContactEmail:
          application.institutionLocation?.primaryContact?.email,
        primaryContactPhone:
          application.institutionLocation?.primaryContact?.phone,
      },
      costs: {
        tuition: application.assessedCostsTuition,
        booksAndSupplies: application.assessedCostsBooksAndSupplies,
        exceptionalExpenses: application.assessedCostsExceptionalExpenses,
        livingAllowance: application.assessedCostsLivingAllowance,
        secondResidence: application.assessedCostsExtraShelter,
        childCare: application.assessedCostsChildCare,
        alimony: application.assessedCostsAlimony,
        totalTransportation:
          (application.assessedCostsLocalTransport ?? 0) +
          (application.assessedCostsReturnTransport ?? 0),
        totalNeed: application.assessedEligibleNeed,
      },
      disbursements: application.disbursements?.map((disbursement) => ({
        awardCode: disbursement.fundingType,
        awardAmount: disbursement.fundingAmount,
        fundingDate: disbursement.fundingDate,
        requestDate: disbursement.dateIssued,
      })),
    };
  }

  /**
   * Get legacy total estimated award
   * @param application legacy application.
   * @returns legacy total estimated award.
   */
  private getLegacyTotalEstimatedAward(application: SFASApplication): number {
    return (
      (application.bslAward ?? 0) +
      (application.cslAward ?? 0) +
      (application.bcagAward ?? 0) +
      (application.bgpdAward ?? 0) +
      (application.csfgAward ?? 0) +
      (application.csgtAward ?? 0) +
      (application.csgdAward ?? 0) +
      (application.csgpAward ?? 0) +
      (application.sbsdAward ?? 0)
    );
  }
}
