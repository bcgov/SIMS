import { Injectable, NotFoundException } from "@nestjs/common";
import {
  Student,
  SFASIndividual,
  ApplicationStatus,
  FullTimeAssessment,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import {
  ApplicationDetailsAPIOutDTO,
  StudentSearchDetails,
} from "./models/student-external-search.dto";
import {
  getISODateOnlyString,
  getTotalDisbursementAmountFromSchedules,
} from "@sims/utilities";
import { ApplicationDetail } from "../../services";

@Injectable()
export class StudentExternalControllerService {
  /**
   * Transform student search result.
   * @param student student.
   * @param sfasIndividual sfas individual.
   * @throws NotFoundException.
   * @returns student search result.
   */
  transformStudentSearchResult(
    student?: Student,
    sfasIndividual?: SFASIndividual,
  ): StudentSearchDetails {
    if (!student && !sfasIndividual) {
      throw new NotFoundException("Student not found.");
    }
    // If the student is found in SIMS, return the student details.
    // Otherwise, return the legacy student details.
    return student
      ? this.transformStudentDetails(student)
      : this.transformLegacyStudentDetails(sfasIndividual);
  }

  /**
   * Transform student application search result.
   * @param studentApplications student applications.
   * @returns student application search result.
   */
  transformApplicationSearchResult(
    studentApplications?: ApplicationDetail[],
  ): ApplicationDetailsAPIOutDTO[] {
    const applications: ApplicationDetailsAPIOutDTO[] = [];
    // TODO: move this transformation and the upcoming legacy transformations to a separate methods.
    if (studentApplications?.length) {
      for (const application of studentApplications) {
        const assessment = application.currentAssessment;
        const scholasticStanding = assessment.studentScholasticStanding;
        const assessmentData = assessment.assessmentData as FullTimeAssessment;
        const workflowData = assessment.workflowData;
        const offering = assessment.offering;
        const institutionLocation = application.location;

        applications.push({
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
            workflowData.dmnValues.fullTimeLivingCategory,
          )
            ? "Away"
            : "Home",
          estimatedTotalAward: getTotalDisbursementAmountFromSchedules(
            assessment.disbursementSchedules,
          ),
          dependants: application.dependants?.map(
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
            primaryContactFirstName:
              institutionLocation.primaryContact.firstName,
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
              return disbursement.disbursementValues.map(
                (disbursementValue) => ({
                  awardCode: disbursementValue.valueCode,
                  awardAmount:
                    disbursement.disbursementScheduleStatus ===
                    DisbursementScheduleStatus.Sent
                      ? disbursementValue.effectiveAmount
                      : disbursementValue.valueAmount,
                  fundingDate: disbursement.disbursementDate,
                  requestDate: getISODateOnlyString(disbursement.dateSent),
                }),
              );
            },
          ),
        });
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
}
