import { JoinColumn, ManyToOne } from "typeorm";
import { ColumnNames } from "../constant";
import { BaseModel } from "./base.model";
import { User } from "./user.model";

/**
 * Abstract class to model a record element which has four audit columns. Creator and Modifier columns are specified here and it includes time stamp columns form BaseModel
 */
export abstract class RecordDataModel extends BaseModel {
  @ManyToOne((type) => User, { eager: false })
  @JoinColumn({
    name: ColumnNames.Creator,
    referencedColumnName: ColumnNames.ID,
  })
  creator: User;
  @ManyToOne((type) => User, { eager: false })
  @JoinColumn({
    name: ColumnNames.Modifier,
    referencedColumnName: ColumnNames.ID,
  })
  modifier: User;
}
