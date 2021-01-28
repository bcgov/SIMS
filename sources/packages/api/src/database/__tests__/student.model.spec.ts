import { closeDB, setupDB } from "../../testHelpers";
import { Connection, getConnection, Repository } from "typeorm";
import * as faker from "faker";
import { Student, User } from '../entities';
import { RecordDataModelController } from '../data.model.controller';


describe('Test student model', () => {
  let connection: Connection;
  beforeAll(async () => {
    connection = await setupDB();
  });
  afterAll(async () => {
    await closeDB();
  
  })

  it('should save student model object with user relationship and address jsonb', async () => {
    // Create
    const controller = new RecordDataModelController<Student>(Student, connection);
    const sub = new Student();
    sub.sin = '9999999999';
    sub.contactInfo = {
      addresses: [ {
        addressLine1: faker.address.streetAddress(),
        city: faker.address.city(),
        country: 'can',
        province: 'bc',
        postalCode: faker.address.zipCode()
      }],
      phone: faker.phone.phoneNumber()
    };
    const user = new User();
    user.userName = faker.random.uuid();
    user.email = faker.internet.email();
    user.firstName = faker.name.firstName();
    user.lastName = faker.name.lastName();
    sub.user = user;

    // Save
    await controller.repo.save(sub);

    // Fetch and test
    const results = await controller.repo.findByIds([sub.id]);
    expect(results.length).toEqual(1);
    const result = results[0];
    expect(result.id).toEqual(sub.id);
    expect(result.user).toBeDefined();
    expect(result.user.id).toEqual(sub.user.id);
    expect(result.contactInfo).toBeDefined();
    expect(result.contactInfo.addresses.length).toEqual(1);
    expect(result.contactInfo.addresses[0].country).toEqual('can');
  });
});