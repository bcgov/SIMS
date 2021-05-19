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
    nullable: true,
  })
  role: string;

  @Column({
    name: "active_indicator",
    nullable: false,
  })
  active: boolean;
}
