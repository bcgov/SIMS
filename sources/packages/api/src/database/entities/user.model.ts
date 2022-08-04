import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseModel } from "./base.model";
import { IdentityProviders } from "./identity-providers.type";

@Entity({ name: TableNames.User })
export class User extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Unique user name generated by Keyclock. Usually in
   * a form of a guid and a suffix like @bceid, @idir, @bcsc.
   */
  @Column({
    name: "user_name",
    nullable: false,
  })
  userName: string;
  /**
   * User email.
   */
  @Column({
    name: "email",
    nullable: false,
  })
  email: string;
  /**
   * First name or given names of the user.
   */
  @Column({
    name: "first_name",
  })
  firstName: string;
  /**
   * Last name or the family name of the user.
   */
  @Column({
    name: "last_name",
  })
  lastName: string;
  /**
   * Indicates if the user is active in the system or should
   * be blocked from executing the login.
   */
  @Column({
    name: "is_active",
  })
  isActive: boolean;
  /**
   * Identity Provider (IDP) used by the user to authenticate
   * to the system (e.g. BCeID, BCSC, IDIR).
   */
  @Column({
    name: "identity_provider_type",
    nullable: false,
  })
  identityProviderType: IdentityProviders;
  // !creator and modifier properties are directly added here(instead of inheriting
  // !from RecordDataModel) to avoid cyclic dependencies.
  /**
   * User creating this user. The user creation can happen when
   * the user himself logs to the system or can happen through a
   * third party responsible for adding this user to the system.
   * For instance, Ministry users can create basic BCeID users or
   * institutions users can add other business BCeID users to
   * their own institution.
   */
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({
    name: ColumnNames.Creator,
    referencedColumnName: ColumnNames.ID,
  })
  creator: User;
  /**
   * User modifying this user. For instance, a Ministry user
   * or Institution user can enable/disable a user, causing
   * a change to this record.
   */
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({
    name: ColumnNames.Modifier,
    referencedColumnName: ColumnNames.ID,
  })
  modifier: User;
}
