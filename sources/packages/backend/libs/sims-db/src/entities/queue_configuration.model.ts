import { QueueNames } from "@sims/services/queue";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { EXCEPTION_NAME_MAX_LENGTH } from "./application-exception-requests.model";
import { QueueConfigurationDetails } from "./queue-configuration.type";
import { RecordDataModel } from "./record.model";

@Entity({ name: TableNames.QueueConfigurations })
export class QueueConfiguration extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Queue name.
   */
  @Column({
    name: "name",
    nullable: false,
    length: EXCEPTION_NAME_MAX_LENGTH,
  })
  queueName: QueueNames;

  /**
   * Queue configuration.
   */
  @Column({
    name: "configuration",
    nullable: false,
    type: "jsonb",
  })
  queueConfiguration: QueueConfigurationDetails;
}
