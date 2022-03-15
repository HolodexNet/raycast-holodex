import { Action, ActionPanel, Detail, useNavigation } from "@raycast/api";
import { formatDistanceToNow } from "date-fns";
import numeral from "numeral";
import { OpenActions } from "./OpenActions";

export function Details(props: {
  title: string;
  description?: string;
  videoId: string;
  liveViewers?: number;
  startedAt?: Date;
  topic?: string;
}) {
  const { pop } = useNavigation();
  const { title, description, videoId, liveViewers, startedAt, topic } = props;
  const markdown = `
![Thumbnail](https://i.ytimg.com/vi/${videoId}/mqdefault.jpg)
# ${title}

👀 ${numeral(liveViewers).format("0a")}${startedAt ? `  ⏱ ${formatDistanceToNow(startedAt)}` : ""}${
    topic ? `  ⚡️ ${topic.split("_").join(" ")}` : ""
  }

${
  description
    ? `---
${description}`
    : ""
}`;

  return (
    <Detail
      navigationTitle={`Live Stream: ${videoId}`}
      markdown={markdown}
      actions={
        <ActionPanel title={`Live Stream: ${videoId}`}>
          <OpenActions videoId={videoId} secondaryShortcut={{ modifiers: ["cmd"], key: "enter" }} />
          <ActionPanel.Section>
            <Action title="Go Back" onAction={pop} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
