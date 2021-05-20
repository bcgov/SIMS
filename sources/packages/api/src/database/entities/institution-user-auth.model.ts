import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InstitutionLocation } from "./institution-location.model";
import { InstitutionUserTypeAndRole } from "./institution-user-type-role.model";
import { InstitutionUser } from "./institution-user.model";
import { RecordDataModel } from "./record.model";

@Entity({
  name: "institution_user_auth",
})
export class InstitutionUserAuth extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => InstitutionLocation, { eager: false })
  @JoinColumn({
    name: "institution_location_id",
    referencedColumnName: "id",
  })
  location: InstitutionLocation;

  @ManyToOne((type) => InstitutionUserTypeAndRole, { eager: true })
  @JoinColumn({
    name: "institution_user_type_role_id",
    referencedColumnName: "id",
  })
  authType: InstitutionUserTypeAndRole;

  @ManyToOne(
    (type) => InstitutionUser,
    (institutionUser) => institutionUser.authorizations,
    { eager: false },
  )
  @JoinColumn({
    name: "institution_user_id",
    referencedColumnName: "id",
  })
  institutionUser: InstitutionUser;
}
