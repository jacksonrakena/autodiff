import {
  Flex,
  HoverCard,
} from "@radix-ui/themes";
import { formatKubeAge } from "../util/well-known-formatters";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { useMemo } from "react";

export const TooltipKubeAge = ({
  creationTimestamp,
  spanProps,
}: {
  creationTimestamp: string;
  spanProps?: React.HTMLAttributes<HTMLSpanElement>;
}) => {
  const age = useMemo(
    () => formatKubeAge(creationTimestamp),
    [creationTimestamp]
  );
  const date = useMemo(
    () => format(creationTimestamp, "eee, d MMM yyyy"),
    [creationTimestamp]
  );

  const localTime = useMemo(
    () => format(creationTimestamp, "h:mm a"),
    [creationTimestamp]
  );

  const localTimezone = useMemo(
    () => format(creationTimestamp, "OOOO"),
    [creationTimestamp]
  );

  const utcTime = useMemo(
    () => format(creationTimestamp, "h:mm a", { in: tz("UTC") }),
    [creationTimestamp]
  );

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <span {...spanProps}>{age}</span>
      </HoverCard.Trigger>
      <HoverCard.Content size="1" maxWidth="300px">
        <Flex gap="1" direction={"column"} style={{ fontSize: "12px" }}>
          <span>{date}</span>
          <span>
            {localTime} local ({localTimezone})
          </span>
          <span>{utcTime} UTC</span>
          <span></span>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  );
};
