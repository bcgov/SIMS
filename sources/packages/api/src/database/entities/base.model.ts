import { CreateDateColumn, UpdateDateColumn} from 'typeorm';
import { ColumnNames } from '../constant';

export abstract class BaseModel  {
  /**
     * Time Columns
     */
    @CreateDateColumn({
      name: ColumnNames.CreateTimestamp,
      nullable: true,
  })
  createdAt: Date;
  @UpdateDateColumn({
      name: ColumnNames.UpdateTimestamp,
      nullable: true
  })
  updatedAt: Date;
}