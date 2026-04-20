import colors from "@/constants/colors";

/**
 * Returns the design tokens for the app palette.
 *
 * The app is currently locked to light mode to keep visuals consistent
 * across iOS, Android, and web.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
