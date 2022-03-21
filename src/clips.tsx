import { Action, ActionPanel, Image, List } from "@raycast/api";
import { useState, useCallback } from "react";
import { Details } from "./components/Details";
import { OpenActions } from "./components/OpenActions";
import { apiRequest, useQuery } from "./lib/api";
import { Clip } from "./lib/interfaces";
import { getPreferences, OrgDropdown } from "./lib/preferences";

interface SearchResult {
  title: string;
  videoId: string;
  videoType: string;
  topic?: string;
  description?: string;
  scheduledStart: string;
  status: string;
  channelId: string;
  channelName: string;
  channelEnglishName?: string;
  avatarUrl: string;
  type: string;
}

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
          <Item key={searchResult.videoId} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function Item({ searchResult }: { searchResult: SearchResult }) {
  const { preferEnglishName } = getPreferences();

  const channelName = searchResult[preferEnglishName ? "channelEnglishName" : "channelName"];

  const parts = [`${channelName}`];

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
      // subtitle={searchResult.description}
      accessoryTitle={parts.join(" ")}
      icon={{ source: searchResult.avatarUrl, mask: Image.Mask.Circle }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Show Details"
              target={<Details title={searchResult.title} videoId={searchResult.videoId} topic={searchResult.topic} />}
            />
            <Action.OpenInBrowser
              title="Open Channel in Browser"
              url={`https://www.youtube.com/channel/${searchResult.channelId}`}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
          <OpenActions videoId={searchResult.videoId} secondaryShortcut={{ modifiers: ["cmd"], key: "enter" }} />
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
            status: "past",
            type: "clip",
            include: "description",
            lang: languageList,
            org,
            limit: 30,
          },
          signal,
        })
      : await apiRequest("search/videoSearch", {
          body: {
            target: ["clip"],
            org: org === "All Vtubers" ? [] : [org],
            lang: languageList,
            sort: "newest",
            include: "description",
            limit: 30,
            conditions: [{ text: query }],
          },
          signal,
        })
  ) as Clip[];

  return response.map((video) => {
    return {
      videoId: video.id,
      title: video.title,
      videoType: video.type,
      scheduledStart: video.published_at,
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
