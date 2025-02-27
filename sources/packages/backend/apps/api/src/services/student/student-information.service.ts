import { Injectable } from "@nestjs/common";
import { Student, SFASIndividual } from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class StudentInformationService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SFASIndividual)
    private readonly sfasIndividualRepo: Repository<SFASIndividual>,
  ) {}

  /**
   * Get student by valid SIN.
   * @param sin student sin number.
   * @returns student.
   */
  async getStudentBySIN(sin: string): Promise<Student> {
    return this.studentRepo.findOne({
      select: {
        id: true,
        birthDate: true,
        contactInfo: true as unknown,
        sinValidation: { id: true, sin: true },
        user: { id: true, firstName: true, lastName: true, email: true },
      },
      relations: { sinValidation: true, user: true },
      where: { sinValidation: { sin, isValidSIN: true } },
    });
  }

  /**
   * Get SFAS Individual by SIN.
   * @param sin student sin number.
   * @returns SFAS Individual.
   */
  async getSFASIndividualBySIN(sin: string): Promise<SFASIndividual> {
    return this.sfasIndividualRepo.findOne({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        sin: true,
        birthDate: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        provinceState: true,
        postalZipCode: true,
        country: true,
      },
      where: { sin },
    });
  }
}
