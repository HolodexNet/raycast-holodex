import { Action, ActionPanel, Icon, Image, List } from "@raycast/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import numeral from "numeral";
import { Details } from "./components/Details";
import { OpenActions } from "./components/OpenActions";
import { apiRequest, useQuery } from "./lib/api";
import { Live } from "./lib/interfaces";
import { getPreferences } from "./lib/preferences";

interface SearchResult {
  title: string;
  videoId: string;
  topic?: string;
  description: string;
  startAt: Date;
  liveViewers: number;
  channelId: string;
  channelName: string;
  channelEnglishName?: string;
  avatarUrl: string;
  status: string;
}

export default function Command() {
  const { isLoading, results } = useSearch();

  return (
    <List isLoading={isLoading}>
      <List.Section title="Live Streams" subtitle={String(results.length)}>
        {results.map((searchResult) => (
          <Item key={searchResult.videoId} result={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function Item({ result }: { result: SearchResult }) {
  const { preferEnglishName } = getPreferences();
  const channelName = result[preferEnglishName ? "channelEnglishName" : "channelName"];

  let icon = Icon.Circle;
  let label = "";

  if (result.status === "upcoming" && result.startAt) {
    label = formatDistanceToNow(result.startAt, { addSuffix: true });
    icon = Icon.Clock;
  } else if (result.status === "live" && result.liveViewers) {
    label = numeral(result.liveViewers).format("0a");
    icon = Icon.Binoculars;
  } else if (result.topic === "membersonly") {
    label = "Members-only";
    icon = Icon.Star;
  }

  const keywords = [result.channelName];

  if (result.channelEnglishName) keywords.push(result.channelEnglishName);

  return (
    <List.Item
      title={result.title}
      subtitle={channelName}
      accessoryTitle={label}
      accessoryIcon={icon}
      keywords={keywords}
      icon={result.avatarUrl ? { source: result.avatarUrl, mask: Image.Mask.Circle } : Icon.Person}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Show Details"
              target={
                <Details
                  title={result.title}
                  description={result.description}
                  videoId={result.videoId}
                  topic={result.topic}
                  liveViewers={result.liveViewers}
                  startedAt={result.startAt}
                />
              }
            />
          </ActionPanel.Section>
          <OpenActions
            videoId={result.videoId}
            primaryShortcut={{ modifiers: ["cmd"], key: "enter" }}
            secondaryShortcut={{ modifiers: ["cmd"], key: "." }}
          />
        </ActionPanel>
      }
    />
  );
}

function useSearch() {
  const {
    state: { isLoading, results },
    perform: search,
  } = useQuery(({ signal }: { signal: AbortSignal }) => performLiveVideoSearch(signal));

  return {
    isLoading,
    search,
    results: results || [],
  };
}

async function performLiveVideoSearch(signal: AbortSignal): Promise<SearchResult[]> {
  const { org } = getPreferences();

  const response = (await apiRequest("live", {
    params: {
      org,
      limit: 100,
      type: "stream",
      max_upcoming_hours: 1,
      include: "description",
    },
    signal,
  })) as Live[];

  return response
    .map((video): SearchResult => {
      return {
        title: video.title,
        videoId: video.id,
        topic: video.topic_id,
        description: video.description,
        startAt: parseISO(video.start_actual ?? video.start_scheduled),
        liveViewers: video.live_viewers ?? 0,
        channelId: video.channel.id,
        channelName: video.channel.name,
        channelEnglishName: video.channel.english_name,
        avatarUrl: video.channel.photo,
        status: video.status,
      };
    })
    .sort((a, b) => b.liveViewers - a.liveViewers);
}
