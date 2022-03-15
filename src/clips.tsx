import { Action, ActionPanel, Image, List } from "@raycast/api";
import { Details } from "./components/Details";
import { OpenActions } from "./components/OpenActions";
import { apiRequest, useQuery } from "./lib/api";
import { Clip } from "./lib/interfaces";
import { getPreferences } from "./lib/preferences";

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
  const { isLoading, results, search } = useSearch();

  return (
    <List isLoading={isLoading} onSearchTextChange={search} searchBarPlaceholder="Search videos..." throttle>
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

function useSearch() {
  const {
    state: { isLoading, results },
    perform: search,
  } = useQuery(({ signal, args }: { signal: AbortSignal; args?: string }) => {
    return performSearch(signal, args);
  });

  return {
    isLoading,
    search,
    results: results || [],
  };
}

async function performSearch(signal: AbortSignal, searchTerm?: string): Promise<SearchResult[]> {
  const emptyQuery = !searchTerm || searchTerm.length === 0;

  const { org, language } = getPreferences();
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
            conditions: [{ text: searchTerm }],
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
