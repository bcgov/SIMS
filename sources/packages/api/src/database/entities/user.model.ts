import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { SINValidation } from ".";
import { BaseModel } from "./base.model";

@Entity({ name: "users" })
export class User extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "user_name",
    nullable: false,
  })
  userName: string;

  @Column({
    name: "email",
    nullable: false,
  })
  email: string;

  @Column({
    name: "first_name",
  })
  firstName: string;

  @Column({
    name: "last_name",
  })
  lastName: string;

  @Column({
    name: "is_active",
  })
  isActive: boolean;

  /**
   * SIN Validation ids related to the user.
   */
  @RelationId((user: User) => user.sinValidations)
  sinValidationsIds: number[];
  /**
   * SIN Validation related to the user.
   */
  @OneToMany(() => SINValidation, (sinValidation) => sinValidation.user, {
    eager: false,
    cascade: true,
  })
  sinValidations: SINValidation[];
}
