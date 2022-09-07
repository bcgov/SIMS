require("../../../env_setup");
import { closeDB, setupDB } from "../../testHelpers";
import { DataSource } from "typeorm";
import * as faker from "faker";
import { SINValidation, Student, User } from "../entities";
import { SFASIndividualService, StudentService } from "../../services";

jest.setTimeout(15000);

describe("Test student model", () => {
  let dataSource: DataSource;
  beforeAll(async () => {
    dataSource = await setupDB();
  });
  afterAll(async () => {
    await closeDB();
  });

  it("should save student model object with user relationship and address jsonb", async () => {
    // Create
    const sfasIndividualService = new SFASIndividualService(dataSource);
    const controller = new StudentService(dataSource, sfasIndividualService);
    const sub = new Student();
    sub.birthDate = faker.date.past(18);
    sub.gender = "X";
    sub.contactInfo = {
      address: {
        addressLine1: faker.address.streetAddress(),
        city: faker.address.city(),
        country: "can",
        provinceState: "bc",
        postalCode: faker.address.zipCode(),
      },
      phone: faker.phone.phoneNumber(),
    };
    const user = new User();
    user.userName = faker.random.uuid();
    user.email = faker.internet.email();
    user.firstName = faker.name.firstName();
    user.lastName = faker.name.lastName();
    sub.user = user;

    // Save student
    await controller.save(sub);

    const sinValidation = new SINValidation();
    sinValidation.student = sub;
    sinValidation.sin = "964652218";
    sub.sinValidation = sinValidation;

    //Update student with new SIN validation
    await controller.save(sub);

    // Fetch and test
    const result = await controller.getStudentById(sub.id);
    expect(result.id).toEqual(sub.id);
    expect(result.user).toBeDefined();
    expect(result.user.id).toEqual(sub.user.id);
    expect(result.contactInfo).toBeDefined();
    expect(result.contactInfo.address).toBeDefined();
    expect(result.contactInfo.address.country).toEqual("can");

    // Remove
    controller.remove(sub);
  });
});
