import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { InstitutionUserAuth } from "./institution-user-auth.model";
import { Institution } from "./institution.model";
import { RecordDataModel } from "./record.model";
import { User } from "./user.model";

@Entity({
  name: "institution_users",
})
export class InstitutionUser extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "user_guid",
    nullable: true,
  })
  guid: string;

  @OneToOne((type) => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: "id",
  })
  user: User;

  @OneToOne((type) => Institution, { eager: true, cascade: true })
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: "id",
  })
  institution: Institution;

  @OneToMany((type) => InstitutionUserAuth, (auth) => auth.institutionUser, {
    eager: true,
    cascade: true,
  })
  authorizations: InstitutionUserAuth[];
}
