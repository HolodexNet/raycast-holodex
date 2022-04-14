import { ActionPanel, Image, List } from "@raycast/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useCallback, useState } from "react";
import { Actions } from "./components/Actions";
import { apiRequest, useQuery } from "./lib/api";
import { Archive } from "./lib/interfaces";
import { getPreferences, OrgDropdown } from "./lib/preferences";

export default function Command() {
  const { org: defaultOrg } = getPreferences();
  const [org, setOrg] = useState<string>(defaultOrg);

  const { isLoading, results, search } = useSearch(org);

  function orgSelected(org: string) {
    setOrg(org);
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={search}
      searchBarPlaceholder="Search videos..."
      throttle
      searchBarAccessory={<OrgDropdown defaultOrg={org} onChange={orgSelected} />}
    >
      <List.Section title="Archives" subtitle={String(results.length)}>
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

  const parts = [];

  switch (result.status) {
    case "upcoming":
      parts.push("🔔");
      break;
    case "new":
      parts.push("🆕");
      break;
  }

  if (result.startAt) {
    parts.push(formatDistanceToNow(result.startAt, { addSuffix: true }));
  }

  return (
    <List.Item
      title={result.title}
      subtitle={channelName}
      accessoryTitle={parts.join(" ")}
      icon={{ source: result.avatarUrl, mask: Image.Mask.Circle }}
      actions={
        <ActionPanel title={`Archive: ${result.videoId}`}>
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
  const [query, setQuery] = useState<string>();

  const { isLoading, data } = useQuery((signal) => performSearch(signal, org, query), [org, query]);

  const search = useCallback((query: string) => {
    setQuery(query);
  }, []);

  return {
    isLoading,
    search,
    results: data || [],
  };
}

async function performSearch(signal: AbortSignal, org: string, query?: string): Promise<SearchResult[]> {
  const emptyQuery = !query || query.length === 0;

  const response = (
    emptyQuery
      ? await apiRequest("videos", {
          params: {
            type: "stream",
            status: ["new", "past"],
            include: "description",
            limit: 30,
            org,
          },
          signal,
        })
      : await apiRequest("search/videoSearch", {
          body: {
            target: ["stream"],
            status: ["new", "past"],
            limit: 30,
            org: org === "All Vtubers" ? [] : [org],
            conditions: [{ text: query }],
          },
          signal,
        })
  ) as Archive[];

  return response.map((video) => {
    return {
      videoId: video.id,
      title: video.title,
      videoType: video.type,
      startAt: parseISO(video.available_at ?? video.published_at),
      topic: video.topic_id,
      description: video.description,
      status: video.status,
      channelId: video.channel.id,
      channelName: video.channel.name,
      channelEnglishName: video.channel.english_name ?? video.channel.name,
      avatarUrl: video.channel.photo,
      type: video.type,
    } as SearchResult;
  });
}

interface SearchResult {
  title: string;
  videoId: string;
  videoType: string;
  topic?: string;
  description: string;
  startAt: Date;
  status: string;
  channelId: string;
  channelName: string;
  channelEnglishName?: string;
  avatarUrl: string;
  type: string;
}
