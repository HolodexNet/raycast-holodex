import { Action, ActionPanel, Image, List } from "@raycast/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useState, useCallback } from "react";
import { Details } from "./components/Details";
import { Actions } from "./components/Actions";
import { apiRequest, useQuery } from "./lib/api";
import { Clip } from "./lib/interfaces";
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
      searchBarAccessory={<OrgDropdown onChange={orgSelected} />}
    >
      <List.Section title="Clips" subtitle={results.length + ""}>
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

  if (result.publishedAt) {
    parts.push(formatDistanceToNow(result.publishedAt, { addSuffix: true }));
  }

  return (
    <List.Item
      title={result.title}
      subtitle={channelName}
      accessoryTitle={parts.join(" ")}
      icon={{ source: result.avatarUrl, mask: Image.Mask.Circle }}
      actions={
        <ActionPanel title={`Clip: ${result.videoId}`}>
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

  const { language } = getPreferences();
  const languageList = language.split(",").map((ln) => ln.trim());

  const response = (
    emptyQuery
      ? await apiRequest("videos", {
          params: {
            type: "clip",
            include: "description",
            limit: 30,
            org,
            lang: languageList,
          },
          signal,
        })
      : await apiRequest("search/videoSearch", {
          body: {
            target: ["clip"],
            limit: 30,
            org: org === "All Vtubers" ? [] : [org],
            conditions: [{ text: query }],
            lang: languageList,
          },
          signal,
        })
  ) as Clip[];

  return response.map((video) => {
    return {
      videoId: video.id,
      title: video.title,
      videoType: video.type,
      publishedAt: parseISO(video.published_at),
      description: video.description,
      status: video.status,
      channelId: video.channel.id,
      channelName: video.channel.name,
      channelEnglishName: video.channel.english_name ?? video.channel.name,
      avatarUrl: video.channel.photo,
      type: video.type,
    };
  });
}

interface SearchResult {
  title: string;
  videoId: string;
  videoType: string;
  topic?: string;
  description?: string;
  publishedAt: Date;
  status: string;
  channelId: string;
  channelName: string;
  channelEnglishName?: string;
  avatarUrl: string;
  type: string;
}
