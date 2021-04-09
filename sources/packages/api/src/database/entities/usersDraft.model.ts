import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { BaseModel } from "./base.model";

@Entity({
  name: "users_draft",
})
export class UsersDraft extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "user_name",
    nullable: false,
  })
  userName: string;

  @Column({
    name: "form_path",
  })
  formPath: string;

  @Column({
    name: "data",
    type: "jsonb",
    nullable: false,
  })
  data: any;
}
