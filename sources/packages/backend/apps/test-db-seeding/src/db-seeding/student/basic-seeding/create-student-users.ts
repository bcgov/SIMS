import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SINValidation, Student, User } from "@sims/sims-db";
import { createFakeStudent, createFakeUser } from "@sims/test-utils";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../../seed-executors";
import { Repository } from "typeorm";
import * as faker from "faker";
import { STUDENTS_INITIAL_DATA } from "./create-student-users.model";

@Injectable()
@DataSeed({ order: SeedPriorityOrder.Priority1 })
export class CreateStudentUsers {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  /**
   * Create student users used for tests.
   */
  @DataSeedMethod()
  async createStudentUsers(): Promise<void> {
    const userCreationPromises = STUDENTS_INITIAL_DATA.map((user) =>
      this.createStudentUser(user.username, user.options),
    );
    await Promise.all(userCreationPromises);
  }

  /**
   * Create a fake student user persisted in the DB.
   * @param username student username.
   * @param options options for the student user.
   * @returns user for the student persisted in the DB.
   */
  private async createStudentUser(
    username: string,
    options?: {
      sin?: string;
      isValidSIN?: boolean;
      sinConsent?: boolean;
      birthDate?: string;
      gender?: string;
    },
  ): Promise<void> {
    // Create the user for the student.
    const fakeUser = createFakeUser(username);
    await this.userRepo.save(fakeUser);
    // Create the student.
    const fakeStudent = createFakeStudent(fakeUser);
    fakeStudent.sinConsent = options.sinConsent ?? false;
    fakeStudent.contactInfo = {
      address: {
        addressLine1: faker.address.streetAddress(),
        city: faker.address.city(),
        country: "Canada",
        provinceState: "ON",
        postalCode: faker.address.zipCode(),
      },
      phone: faker.phone.phoneNumber(),
    };

    await this.studentRepo.save(fakeStudent);

    if (options?.sin) {
      const sinValidation = new SINValidation();
      sinValidation.student = fakeStudent;
      fakeStudent.sinValidation = sinValidation;
      sinValidation.sin = options.sin;
      sinValidation.isValidSIN = options.isValidSIN ?? false;
    }

    await this.studentRepo.save(fakeStudent);
  }
}
