import { QueueNames } from "@sims/utilities";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { QueueConfigurationDetails } from "./queue-configuration.type";
import { RecordDataModel } from "./record.model";

const QUEUE_NAME_MAX_LENGTH = 100;

@Entity({ name: TableNames.QueueConfigurations })
export class QueueConfiguration extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Queue name.
   */
  @Column({
    name: "queue_name",
    nullable: false,
    length: QUEUE_NAME_MAX_LENGTH,
  })
  queueName: QueueNames;

  /**
   * Queue configuration.
   */
  @Column({
    name: "queue_configuration",
    nullable: false,
    type: "jsonb",
  })
  queueConfiguration: QueueConfigurationDetails;

  /**
   * Active flag which decides if the Queue is active
   */
  @Column({
    name: "is_active",
    nullable: false,
  })
  isActive: boolean;
}
