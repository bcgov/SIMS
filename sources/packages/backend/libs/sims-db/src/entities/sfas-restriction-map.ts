import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";

/**
 * Restriction maps between legacy codes and SIMS codes.
 */
@Entity({ name: TableNames.SFASRestrictionMaps })
export class SFASRestrictionMap {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * SFAS restriction code.
   */
  @Column({
    name: "legacy_code",
  })
  legacyCode: string;

  /**
   * SIMS restriction code.
   */
  @Column({
    name: "code",
  })
  code: string;

  /**
   * Indicates if the code is a legacy code, which has no direct mapping to SIMS,
   * and a SIMS restriction must be created if not present. This restriction should
   * not be managed by SIMS, it can only transition to resolved.
   */
  @Column({
    name: "is_legacy_only",
  })
  isLegacyOnly: boolean;

  /**
   * Record creation timestamp.
   */
  @CreateDateColumn({
    name: ColumnNames.CreateTimestamp,
  })
  createdAt: Date;
}
