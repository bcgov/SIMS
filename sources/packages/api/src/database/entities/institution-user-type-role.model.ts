import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { RecordDataModel } from "./record.model";

@Entity({
  name: "institution_user_type_roles",
})
export class InstitutionUserTypeAndRole extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "user_type",
    nullable: false,
  })
  type: string;

  @Column({
    name: "user_role",
    nullable: false,
  })
  role: string;

  @Column({
    name: "user_type_description",
    nullable: true,
  })
  typeDescription: string;

  @Column({
    name: "user_role_description",
    nullable: true,
  })
  roleDescription: string;

  @Column({
    name: "active_indicator",
    nullable: false,
  })
  active: boolean;
}
