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
  StudentSearchResultAPIOutDTO,
} from "./models/student-external-search.dto";
import {
  getISODateOnlyString,
  getTotalDisbursementAmountFromSchedules,
} from "@sims/utilities";

type StudentDetails = Omit<StudentSearchResultAPIOutDTO, "applications">;
@Injectable()
export class StudentExternalControllerService {
  /**
   * Get student search result.
   * @param student student.
   * @param sfasIndividual sfas individual.
   * @throws NotFoundException.
   * @returns student search result.
   */
  getStudentSearchResult(
    student?: Student,
    sfasIndividual?: SFASIndividual,
  ): StudentSearchResultAPIOutDTO {
    if (!student && !sfasIndividual) {
      throw new NotFoundException("Student not found.");
    }
    // If the student is found in SIMS, return the student details.
    // Otherwise, return the legacy student details.
    const studentDetails = student
      ? this.transformStudentDetails(student)
      : this.transformLegacyStudentDetails(sfasIndividual);
    const applications: ApplicationDetailsAPIOutDTO[] = [];

    if (student) {
      for (const application of student.applications) {
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
          dependants: application.data.dependants?.map(
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
    if (sfasIndividual) {
      //TODO: Get student applications from SFAS.
    }

    return {
      ...studentDetails,
      applications,
    };
  }
  /**
   * Transform to student details.
   * @param student student.
   * @returns student details.
   */
  transformStudentDetails(student: Student): StudentDetails {
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
  transformLegacyStudentDetails(
    sfasIndividual: SFASIndividual,
  ): StudentDetails {
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
