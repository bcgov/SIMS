import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import { BaseModel } from './base.model';

@Entity({ name: 'users'})
export class User extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'user_name'
  })
  userName: string;

  @Column({
    name: 'email'
  })
  email: string;

  @Column()
  guid: string

}
