import { Type } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { FormService } from "../../services";

/**
 * Mock dry run submission.
 * @param formName form name.
 * @param formData form data.
 */
export async function mockDryRunSubmission(
  testingModule: TestingModule,
  module: Type,
  formName: string,
  formData: unknown,
  options?: { valid?: boolean },
): Promise<void> {
  const formService = await getProviderInstanceForModule(
    testingModule,
    module,
    FormService,
  );
  const dryRunSubmissionMock = jest.fn().mockResolvedValueOnce({
    valid: options?.valid ?? true,
    formName,
    data: { data: formData },
  });
  formService.dryRunSubmission = dryRunSubmissionMock;
}
