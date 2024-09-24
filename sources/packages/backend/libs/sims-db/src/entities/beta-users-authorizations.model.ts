import { TableNames } from "@sims/sims-db/constant";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Beta users authorizations table. Only users with a BCSC credential that matches given name and last name
 * in the period starting from `enabled_from` column will be allowed during the beta user period.
 */
@Entity({ name: TableNames.BetaUsersAuthorizations })
export class BetaUsersAuthorizations {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Beta user given names.
   */
  @Column({
    name: "given_names",
    nullable: true,
  })
  givenNames: string;

  /**
   * Beta user last name.
   */
  @Column({
    name: "last_name",
    nullable: false,
  })
  lastName: string;

  /**
   * Starting date and time to enable beta user to access the system.
   */
  @Column({
    name: "enabled_from",
    type: "timestamptz",
    nullable: false,
  })
  enabledFrom: Date;
}
