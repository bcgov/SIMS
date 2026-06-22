/**
 * Kubernetes object metadata, common to all Kubernetes resources.
 */
export interface KubernetesObjectMeta {
  name?: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  generation?: number;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  managedFields?: unknown[];
}

/**
 * Image stream tag history item, representing a specific version of an image tag within an OpenShift ImageStream, including its creation timestamp and associated metadata.
 */
export interface ImageStreamTagHistoryItem {
  created: string;
  dockerImageReference?: string;
  image: string;
  generation?: number;
}

/**
 * Image stream tag definition, representing a specific tag within an OpenShift ImageStream, including its name and history of versions.
 */
export interface ImageStreamTag {
  tag: string;
  items?: ImageStreamTagHistoryItem[];
}

/**
 * Image stream spec definition, representing the desired state of an OpenShift ImageStream, including lookup policy settings.
 */
export interface ImageStreamSpec {
  lookupPolicy?: unknown;
}

/**
 * Image stream status, representing the current state of an OpenShift ImageStream, including the Docker image repository URLs and the list of tags available in the image stream.
 */
export interface ImageStreamStatus {
  dockerImageRepository?: string;
  publicDockerImageRepository?: string;
  tags?: ImageStreamTag[];
}

/**
 * Image stream resource definition, representing an OpenShift ImageStream object, which manages a collection of container images and their tags within a namespace.
 */
export interface ImageStreamResource {
  kind: string;
  apiVersion: string;
  metadata: KubernetesObjectMeta;
  spec?: ImageStreamSpec;
  status?: ImageStreamStatus;
}

/**
 * Options required to initialize the SIMS OpenShift client wrapper.
 */
export interface OpenshiftClientOptions {
  config: {
    openShiftUrl: string;
    licensePlate: string;
    saToken: string;
  };
}
