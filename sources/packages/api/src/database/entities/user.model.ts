import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import { BaseModel } from './base.model';

@Entity({ name: 'users'})
export class User extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'user_name',
    nullable: false,
  })
  userName: string;

  @Column({
    name: 'email',
    nullable: false
  })
  email: string;

  @Column({
    name: 'first_name'
  })
  firstName: string;

  @Column({
    name: 'last_name'
  })
  lastName: string;
}
