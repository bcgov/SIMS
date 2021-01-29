import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ColumnNames } from '../constant';

/**
 * The base model class which includes basic timestamp columns and other common activities
 */
export abstract class BaseModel {
  /**
   * Time Columns
  */
  @CreateDateColumn({
    name: ColumnNames.CreateTimestamp
  })
  createdAt: Date;
  @UpdateDateColumn({
    name: ColumnNames.UpdateTimestamp
  })
  updatedAt: Date;
}

