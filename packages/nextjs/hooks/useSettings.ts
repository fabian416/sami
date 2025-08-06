import { allSettings } from "~~/utils/settings";

export const useSettings = () => {
  const origin = typeof window !== "undefined" ? window.origin : "default";
  return allSettings[origin] || allSettings.default;
};
