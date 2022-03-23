import { Action, ActionPanel, Detail, useNavigation } from "@raycast/api";
import { formatDistanceToNow } from "date-fns";
import numeral from "numeral";
import { Actions } from "./Actions";

export function Details(props: {
  videoId: string;
  channelId: string;
  title: string;
  description?: string;
  liveViewers?: number;
  createdAt?: Date;
  topic?: string;
}) {
  const { pop } = useNavigation();
  const { title, description, videoId, liveViewers, createdAt, topic } = props;

  const markdown = `
![Thumbnail](https://i.ytimg.com/vi/${videoId}/mqdefault.jpg)
# ${title}

${liveViewers ? `👀 ${numeral(liveViewers).format("0a")}` : ""}${
    createdAt ? `  ⏱ ${formatDistanceToNow(createdAt, { addSuffix: true })}` : ""
  }${topic ? `  ⚡️ ${topic.split("_").join(" ")}` : ""}

${
  description
    ? `---
${description}`
    : ""
}`;

  return (
    <Detail
      navigationTitle={`Video: ${videoId}`}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Actions
            isInDetail={true}
            videoId={props.videoId}
            channelId={props.channelId}
            title={props.title}
            description={props.description}
            topic={props.topic}
            createdAt={props.createdAt}
          />
          <ActionPanel.Section>
            <Action title="Go Back" onAction={pop} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
