import { ZBClient } from "zeebe-node";

export function createZeebeClient(): ZBClient {
  const zeebeClient = new ZBClient();
  zeebeClient.createWorker({
    taskType: "associate-workflow-instance",
    taskHandler: (job) => job.complete(),
  });
  zeebeClient.createWorker({
    taskType: "save-disbursement-schedules",
    taskHandler: (job) => job.complete(),
  });
  zeebeClient.createWorker({
    taskType: "save-assessment-data",
    taskHandler: (job) => job.complete(),
  });
  zeebeClient.createWorker({
    taskType: "update-noa-status",
    taskHandler: (job) => job.complete(),
  });
  return zeebeClient;
}
