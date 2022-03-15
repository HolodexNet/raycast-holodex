import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  apiKey: string;
  org: string;
  language: string;
  preferEnglishName: boolean;
  preferYouTube: boolean;
}

export function getPreferences() {
  return getPreferenceValues<Preferences>();
}
