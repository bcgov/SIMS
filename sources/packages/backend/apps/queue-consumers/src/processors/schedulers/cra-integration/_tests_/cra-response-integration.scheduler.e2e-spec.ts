import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../test/helpers";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { CRAResponseIntegrationScheduler } from "../cra-response-integration.scheduler";

const CRA_FILENAME = "CRA_200_PBCSA00000.TXT";

describe(describeProcessorRootTest(QueueNames.CRAResponseIntegration), () => {
  let app: INestApplication;
  let processor: CRAResponseIntegrationScheduler;
  let db: E2EDataSources;
  let sftpClientMock: DeepMocked<Client>;
  let craResponseFolder: string;

  beforeAll(async () => {
    craResponseFolder = path.join(__dirname, "cra-response-files");
    process.env.CRA_RESPONSE_FOLDER = craResponseFolder;
    const { nestApplication, dataSource, sshClientMock } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sftpClientMock = sshClientMock;
    processor = app.get(CRAResponseIntegrationScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  // Add your test cases here

  // Dummy TODO test
  it("TODO: should process CRA response file", () => {
    // This is a placeholder test
    expect(true).toBe(true);
  });
});
