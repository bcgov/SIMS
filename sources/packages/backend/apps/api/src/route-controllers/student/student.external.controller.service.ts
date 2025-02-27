import { Injectable, NotFoundException } from "@nestjs/common";
import { Student, SFASIndividual } from "@sims/sims-db";
import {
  ApplicationDetailsAPIOutDTO,
  StudentSearchResultAPIOutDTO,
} from "./models/student-external-search.dto";

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
      //TODO: Get student applications from SIMS.
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
