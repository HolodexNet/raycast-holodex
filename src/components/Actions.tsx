import { Action, ActionPanel, getPreferenceValues, Icon } from "@raycast/api";
import { Shortcut } from "@raycast/api/types/api/app/keyboard";
import { useMemo } from "react";
import { Details } from "./Details";

export function Actions({
  videoId,
  channelId,
  title,
  description,
  topic,
  createdAt,
  isInDetail = false,
}: {
  videoId: string;
  channelId: string;
  title: string;
  description?: string;
  topic?: string;
  createdAt?: Date;
  isInDetail?: boolean;
}) {
  const prefs = getPreferenceValues();
  const preferYouTube = prefs["prefer-youtube"];

  const primaryShortcut = useMemo<Shortcut>(() => ({ modifiers: ["cmd"], key: "enter" }), []);
  const secondaryShortcut = useMemo<Shortcut>(() => ({ modifiers: ["cmd"], key: "." }), []);

  const holodexUrl = `https://holodex.net/watch/${videoId}`;
  const holodexChannelUrl = `https://holodex.net/channel/${channelId}`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const youtubeChannelUrl = `https://www.youtube.com/channel/${channelId}`;

  const Holodex = ({ shortcut }: { shortcut?: Shortcut }) => (
    <Action.OpenInBrowser
      title="Open in Holodex"
      url={holodexUrl}
      icon={{ source: "holodex.png" }}
      shortcut={shortcut}
    />
  );

  const YouTube = ({ shortcut }: { shortcut?: Shortcut }) => (
    <Action.OpenInBrowser title="Open in YouTube" url={youtubeUrl} icon={{ source: "yt.png" }} shortcut={shortcut} />
  );

  const HolodexChannel = () => (
    <Action.OpenInBrowser title="Open in Holodex" url={holodexChannelUrl} icon={{ source: "holodex.png" }} />
  );

  const YouTubeChannel = () => (
    <Action.OpenInBrowser title="Open in YouTube" url={youtubeChannelUrl} icon={{ source: "yt.png" }} />
  );

  return (
    <>
      <ActionPanel.Section>
        {!isInDetail && (
          <Action.Push
            title="Show Details"
            icon={Icon.TextDocument}
            target={
              <Details
                title={title}
                description={description}
                videoId={videoId}
                channelId={channelId}
                topic={topic}
                createdAt={createdAt}
              />
            }
          />
        )}
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
      <ActionPanel.Section title={`Channel: ${channelId}`}>
        {preferYouTube ? (
          <>
            <YouTubeChannel />
            <HolodexChannel />
          </>
        ) : (
          <>
            <HolodexChannel />
            <YouTubeChannel />
          </>
        )}
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action.CopyToClipboard content={preferYouTube ? youtubeUrl : holodexUrl} title="Copy Video URL" />
        <Action.CopyToClipboard
          content={preferYouTube ? youtubeChannelUrl : holodexChannelUrl}
          title="Copy Channel URL"
        />
      </ActionPanel.Section>
    </>
  );
}
