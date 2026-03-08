import {
  BUILT_IN_DELIVERY_PROFILES,
  DELIVERY_PROFILE_NAMES,
  type DeliveryProfileName,
} from "./built-in.js";

export function resolveDeliveryProfile(
  rawConfig: Record<string, unknown>,
): Record<string, unknown> {
  if (!("deliveryProfile" in rawConfig) || rawConfig.deliveryProfile === undefined) {
    return rawConfig;
  }

  const deliveryProfile = rawConfig.deliveryProfile;
  if (typeof deliveryProfile !== "string") {
    return rawConfig;
  }

  if (!(deliveryProfile in BUILT_IN_DELIVERY_PROFILES)) {
    throw new Error(
      `Unknown delivery profile "${deliveryProfile}". Try: use one of the available delivery profiles: ${DELIVERY_PROFILE_NAMES.join(", ")}.`,
    );
  }

  return {
    ...BUILT_IN_DELIVERY_PROFILES[deliveryProfile as DeliveryProfileName],
    ...rawConfig,
  };
}
