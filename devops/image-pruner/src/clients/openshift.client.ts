import type {
  DeploymentResource,
  ImageStreamResource,
  JobResource,
  OpenShiftClient,
  OpenShiftResponse,
  OpenShiftRestClientModule,
} from "../models/openshift.model";
import type { PruneConfig } from "../models/prune.model";

const openshiftRestClient =
  require("openshift-rest-client") as OpenShiftRestClientModule;

async function requestBody<T>(
  request: Promise<OpenShiftResponse<T>>,
): Promise<T> {
  const response = await request;
  return response.body;
}

/**
 * Creates an OpenShift client instance.
 * @param config The prune configuration.
 * @returns The OpenShift client instance.
 */
export async function createOpenShiftClient(
  config: PruneConfig,
): Promise<OpenShiftClient> {
  const clusterName = config.openShiftUrl.replace(/(^\w+:|^)\/\//, "");

  return openshiftRestClient.OpenshiftClient({
    loadSpecFromCluster: false,
    config: {
      apiVersion: "v1",
      kind: "Config",
      clusters: [
        {
          name: clusterName,
          cluster: {
            server: config.openShiftUrl,
          },
        },
      ],
      users: [
        {
          name: `${config.licensePlate}-user`,
          user: {
            token: config.saToken,
          },
        },
      ],
      contexts: [
        {
          name: `${clusterName}/${config.licensePlate}-context`,
          context: {
            cluster: clusterName,
            user: `${config.licensePlate}-user`,
          },
        },
      ],
      "current-context": `${clusterName}/${config.licensePlate}-context`,
      preferences: {},
    },
  });
}

/**
 * Retrieves a deployment resource from the OpenShift cluster.
 * @param client The OpenShift client instance.
 * @param namespace The namespace of the deployment.
 * @param name The name of the deployment.
 * @returns The deployment resource.
 */
export async function getDeployment(
  client: OpenShiftClient,
  namespace: string,
  name: string,
): Promise<DeploymentResource> {
  return requestBody(
    client.apis.apps.v1.namespaces(namespace).deployments(name).get(),
  );
}
/**
 * Retrieves a job resource from the OpenShift cluster.
 * @param client The OpenShift client instance.
 * @param namespace The namespace of the job.
 * @param name The name of the job.
 * @returns The job resource.
 */
export async function getJob(
  client: OpenShiftClient,
  namespace: string,
  name: string,
): Promise<JobResource> {
  return requestBody(
    client.apis.batch.v1.namespaces(namespace).jobs(name).get(),
  );
}

/**
 * Retrieves an image stream resource from the OpenShift cluster.
 * @param client The OpenShift client instance.
 * @param namespace The namespace of the image stream.
 * @param name The name of the image stream.
 * @returns The image stream resource.
 */
export async function getImageStream(
  client: OpenShiftClient,
  namespace: string,
  name: string,
): Promise<ImageStreamResource> {
  return requestBody(
    client.apis.image.v1.namespaces(namespace).imagestreams(name).get(),
  );
}

/**
 * Deletes an image stream tag from the OpenShift cluster.
 * @param client The OpenShift client instance.
 * @param namespace The namespace of the image stream.
 * @param imageStreamName The name of the image stream.
 * @param tag The tag to delete.
 * @returns A promise that resolves when the tag is deleted.
 */
export async function deleteImageStreamTag(
  client: OpenShiftClient,
  namespace: string,
  imageStreamName: string,
  tag: string,
): Promise<void> {
  await client.apis.image.v1
    .namespaces(namespace)
    .imagestreamtags(`${imageStreamName}:${tag}`)
    .delete();
}
