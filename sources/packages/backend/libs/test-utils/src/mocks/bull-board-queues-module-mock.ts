import { Global, Module } from "@nestjs/common";

/**
 * Mock to entirely replace the Bull Board queues module
 * that are not part of the E2E tests.
 */
@Global()
@Module({})
export class BullBoardQueuesModuleMock {}
