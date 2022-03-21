import { Action, ActionPanel, Image, List } from "@raycast/api";
import { useCallback, useState } from "react";
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
      searchBarAccessory={<OrgDropdown onChange={orgSelected} />}
    >
      <List.Section title="Archives" subtitle={String(results.length)}>
        {results.map((searchResult) => (
          <Item key={searchResult.videoId} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function Item({ searchResult }: { searchResult: SearchResult }) {
  const { preferEnglishName } = getPreferences();

  const channelName = searchResult[preferEnglishName ? "channelEnglishName" : "channelName"];

  const parts = [];

  switch (searchResult.status) {
    case "upcoming":
      parts.push("🔔");
      break;
    case "new":
      parts.push("🆕");
      break;
  }

  return (
    <List.Item
      title={searchResult.title}
      subtitle={channelName}
      accessoryTitle={parts.join(" ")}
      icon={{ source: searchResult.avatarUrl, mask: Image.Mask.Circle }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Holodex" url={`https://holodex.net/watch/${searchResult.videoId}`} />
            <Action.OpenInBrowser
              title="Open in YouTube"
              url={`https://www.youtube.com/watch?v=${searchResult.videoId}`}
              shortcut={{ modifiers: ["cmd"], key: "enter" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open Channel in Browser"
              url={`https://www.youtube.com/channel/${searchResult.channelId}`}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
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
            lang: "en",
            org,
            status: ["new", "past"],
            limit: 30,
            type: "stream",
          },
          signal,
        })
      : await apiRequest("search/videoSearch", {
          body: {
            lang: ["en"],
            org: org === "All Vtubers" ? [] : [org],
            status: ["new", "past"],
            limit: 30,
            sort: "newest",
            target: ["stream"],
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
      scheduledStart: video.published_at,
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
  scheduledStart: string;
  status: string;
  channelId: string;
  channelName: string;
  channelEnglishName?: string;
  avatarUrl: string;
  type: string;
}
