import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection } from "typeorm";
import { Institution } from "src/database/entities/institution.model";

@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(InstitutionLocation));
  }

  async getById(id: number): Promise<InstitutionLocation> {
    return await this.repo.findOne(id);
  }

  // TODO: Create the final method to add a location.
  // This method was just created to add a dummy location
  // to the DB while testing the GET location method.
  async createtLocation(): Promise<InstitutionLocation> {
    const institution = { id: 1 };
    const newLocation = {
      name: "New Dummy Location",
      data: {
        address: {
          addressLine1: "Address Line 1",
          addressLine2: "Address Line 2",
          province: "BC",
          country: "Canada",
          city: "Victoria",
          postalCode: "V9A 3AA",
        },
      },
      institution: institution,
    };

    return await this.repo.save(newLocation);
  }
}
