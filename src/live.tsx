import { ActionPanel, Icon, Image, List } from "@raycast/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import numeral from "numeral";
import { useState } from "react";
import { Actions } from "./components/Actions";
import { apiRequest, useQuery } from "./lib/api";
import { Live } from "./lib/interfaces";
import { getPreferences, OrgDropdown } from "./lib/preferences";

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
  const { org: defaultOrg } = getPreferences();
  const [org, setOrg] = useState<string>(defaultOrg);

  const { isLoading, results } = useSearch(org);

  function orgSelected(org: string) {
    setOrg(org);
  }

  return (
    <List isLoading={isLoading} searchBarAccessory={<OrgDropdown defaultOrg={org} onChange={orgSelected} />}>
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

  if (result.channelEnglishName) keywords.push(...result.channelEnglishName.split(" "));

  return (
    <List.Item
      title={result.title}
      subtitle={channelName}
      accessoryTitle={label}
      accessoryIcon={icon}
      keywords={keywords}
      icon={result.avatarUrl ? { source: result.avatarUrl, mask: Image.Mask.Circle } : Icon.Person}
      actions={
        <ActionPanel title={`Live Stream: ${result.videoId}`}>
          <Actions
            videoId={result.videoId}
            channelId={result.channelId}
            title={result.title}
            description={result.description}
            topic={result.topic}
          />
        </ActionPanel>
      }
    />
  );
}

function useSearch(org: string) {
  const { isLoading, data } = useQuery((signal) => performLiveVideoSearch(signal, org), [org]);

  // console.log("useSearch", org, isLoading, data?.length);

  return {
    isLoading,
    results: data || [],
  };
}

async function performLiveVideoSearch(signal: AbortSignal, org: string): Promise<SearchResult[]> {
  console.log("performLiveVideoSearch", org);
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
