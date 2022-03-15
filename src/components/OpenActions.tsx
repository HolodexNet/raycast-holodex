import { Action, ActionPanel, getPreferenceValues } from "@raycast/api";
import { Shortcut } from "@raycast/api/types/api/app/keyboard";

export function OpenActions({
  videoId,
  primaryShortcut,
  secondaryShortcut,
}: {
  videoId: string;
  primaryShortcut?: Shortcut;
  secondaryShortcut?: Shortcut;
}) {
  const prefs = getPreferenceValues();
  const preferYouTube = prefs["prefer-youtube"];

  const Holodex = ({ shortcut }: { shortcut?: Shortcut }) => (
    <Action.OpenInBrowser
      title="Open in Holodex"
      url={`https://holodex.net/watch/${videoId}`}
      icon={{ source: "holodex.png" }}
      shortcut={shortcut}
    />
  );
  const YouTube = ({ shortcut }: { shortcut?: Shortcut }) => (
    <Action.OpenInBrowser
      title="Open in YouTube"
      url={`https://www.youtube.com/watch?v=${videoId}`}
      icon={{ source: "yt.png" }}
      shortcut={shortcut}
    />
  );

  return (
    <ActionPanel.Section>
      {preferYouTube ? (
        <>
          <YouTube shortcut={primaryShortcut} />
          <Holodex shortcut={secondaryShortcut} />
        </>
      ) : (
        <>
          <Holodex shortcut={primaryShortcut} />
          <YouTube shortcut={secondaryShortcut} />
        </>
      )}
    </ActionPanel.Section>
  );
}
