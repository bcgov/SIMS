import dayjs from "dayjs";

/**
 * Number of days before the token expiry to consider it as expiring soon and renew it.
 * Keeping this threshold at 14 days as the job is scheduled weekly.
 */
const TOKEN_EXPIRY_THRESHOLD_DAYS = 14;

function validateTokenExpiry() {
  const token = process.env.SA_TOKEN;

  if (!token) {
    throw new Error("Missing value for the environment variable: SA_TOKEN.");
  }

  // JWTs are in 3 parts separated by dots. We need the payload (2nd part).
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid token format.");
  }

  // Decode Base64Url payload.
  const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
  const payload: { exp: number } = JSON.parse(payloadJson);

  const expValue = payload.exp;
  if (typeof expValue !== "number" || !Number.isFinite(expValue)) {
    throw new Error(
      "The property 'exp' is either not found or invalid in SA_TOKEN payload.",
    );
  }

  const expiryDate = new Date(expValue * 1000);
  console.info(`SA_TOKEN expiry date: ${expiryDate.toUTCString()}`);

  const isTokenExpiringSoon = dayjs(expiryDate).isBefore(
    dayjs(new Date()).add(TOKEN_EXPIRY_THRESHOLD_DAYS, "day"),
  );

  if (isTokenExpiringSoon) {
    throw new Error(
      `Token expires in less than ${TOKEN_EXPIRY_THRESHOLD_DAYS} days. Please renew the SA_TOKEN.`,
    );
  }
  console.info(
    `Success: Token is valid for more than ${TOKEN_EXPIRY_THRESHOLD_DAYS} days.`,
  );
}

try {
  validateTokenExpiry();
} catch (error: unknown) {
  throw new Error("SA_TOKEN validation failed.", { cause: error });
}
