import type { ImageStreamTag } from "../models/openshift.model";

/**
 * Extracts the ImageStream name from a full image reference string.
 * For example, "registry.apps.gold/ns/db-migrations-sims:main-12345"
 * returns "db-migrations-sims".
 * @param image The full image reference string.
 * @returns The ImageStream name portion of the image reference.
 */
export function extractImageStreamName(image: string): string {
  const parts = image.split(/[/:]/);
  if (parts.length < 2) {
    throw new Error(`Cannot extract ImageStream name from image: ${image}.`);
  }

  return parts.at(-2) || "";
}

/**
 * Extracts the image tag name from a full image reference string.
 * @param image The full image reference string.
 * @returns The image tag name.
 */
export function extractImageTagName(image: string): string {
  const [imageWithoutDigest] = image.split("@");
  const lastColon = imageWithoutDigest.lastIndexOf(":");
  if (lastColon === -1 || lastColon === imageWithoutDigest.length - 1) {
    throw new Error(`Cannot extract image tag from image: ${image}.`);
  }

  return imageWithoutDigest.slice(lastColon + 1);
}

/**
 * Returns the creation timestamp string of the most recent item in an image stream tag.
 * @param tag The image stream tag.
 * @returns The creation timestamp string, or "unknown" if not available.
 */
export function getTagCreatedAt(tag: ImageStreamTag): string {
  return tag.items?.[0]?.created ?? "unknown";
}

/**
 * Returns the creation timestamp of an image stream tag as a numeric value for sorting.
 * Tags with an invalid or missing timestamp are treated as the oldest.
 * @param tag The image stream tag.
 * @returns The numeric timestamp, or 0 if the timestamp is missing or invalid.
 */
export function getTagCreatedAtTimestamp(tag: ImageStreamTag): number {
  const createdAt = getTagCreatedAt(tag);
  const createdAtTimestamp = Date.parse(createdAt);
  if (Number.isNaN(createdAtTimestamp)) {
    console.warn(
      `Invalid creation timestamp for tag ${tag.tag}: ${createdAt}. Treating as oldest.`,
    );
    return 0;
  }

  return createdAtTimestamp;
}
