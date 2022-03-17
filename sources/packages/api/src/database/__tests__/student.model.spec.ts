require("../../../env_setup");
import { closeDB, setupDB } from "../../testHelpers";
import { Connection } from "typeorm";
import * as faker from "faker";
import { SINValidation, Student, User } from "../entities";
import { SFASIndividualService, StudentService } from "../../services";

jest.setTimeout(15000);

describe("Test student model", () => {
  let connection: Connection;
  beforeAll(async () => {
    connection = await setupDB();
  });
  afterAll(async () => {
    await closeDB();
  });

  it("should save student model object with user relationship and address jsonb", async () => {
    // Create
    const sfasIndividualService = new SFASIndividualService(connection);
    const controller = new StudentService(connection, sfasIndividualService);
    const sub = new Student();
    sub.sin = "9999999999";
    sub.birthDate = faker.date.past(18);
    sub.gender = "X";
    sub.contactInfo = {
      addresses: [
        {
          addressLine1: faker.address.streetAddress(),
          city: faker.address.city(),
          country: "can",
          province: "bc",
          postalCode: faker.address.zipCode(),
        },
      ],
      phone: faker.phone.phoneNumber(),
    };
    const user = new User();
    user.userName = faker.random.uuid();
    user.email = faker.internet.email();
    user.firstName = faker.name.firstName();
    user.lastName = faker.name.lastName();
    sub.user = user;
    const sinValidation = new SINValidation();
    sinValidation.user = user;
    sub.sinValidation = sinValidation;

    // Save
    await controller.save(sub);

    // Fetch and test
    const result = await controller.findById(sub.id);
    expect(result.id).toEqual(sub.id);
    expect(result.user).toBeDefined();
    expect(result.user.id).toEqual(sub.user.id);
    expect(result.contactInfo).toBeDefined();
    expect(result.contactInfo.addresses.length).toEqual(1);
    expect(result.contactInfo.addresses[0].country).toEqual("can");

    // Remove
    controller.remove(sub);
  });
});
