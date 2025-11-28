import {
  Box,
  Flex,
  DataList,
  Table,
  Badge,
  Text,
  ScrollArea,
  Tooltip,
  Spinner,
  TextField,
} from "@radix-ui/themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { http, useKeyPress } from "./App";
import humanize from "@jsdevtools/humanize-anything";

import { intervalToDuration, formatDuration } from "date-fns";
import { RowType, discoverRows } from "./row-discovery";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export const ResourceTable = ({
  resource,
}: {
  resource: {
    kind: string;
    group: string;
    plural: string;
    version: string;
  };
}) => {
  const ref = useRef<HTMLInputElement | null>(null);
  useKeyPress("/", () => {
    ref.current?.focus();
  });
  useKeyPress(
    "Escape",
    () => {
      setSearchTerm("");
      ref.current?.blur();
    },
    { noEffectWhileInTextInput: false }
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceState, setResourceState] = useState<
    | { state: "loading" }
    | { state: "error"; error: string }
    | { state: "ready"; resources: any[] }
  >({ state: "loading" });
  useEffect(() => {
    (async () => {
      setResourceState({ state: "loading" });
      console.log("Fetching resources for", resource);
      const path =
        resource.group === ""
          ? `/api/${resource.version}/${resource.kind.toLowerCase()}s`
          : `/apis/${resource.group}/${
              resource.version
            }/${resource.kind.toLowerCase()}s`;
      const res = await http<{ items: any[] }>(path);
      if (res.success) {
        console.log(res.data);
        setResourceState({ state: "ready", resources: res.data.items });
      } else {
        setResourceState({ state: "error", error: res.error });
      }
    })();
  }, [resource]);
  const [defaultRows, setDefaultRows] = useState<RowType[]>([]);
  useEffect(() => {
    (async () => {
      const discovered =
        resourceState.state === "ready" && resourceState.resources.length > 0
          ? await discoverRows(resource, resourceState.resources[0])
          : [];
      setDefaultRows([
        {
          name: "Name",
          render: (item: any) => (
            <Flex direction="column">
              {item.metadata?.name ?? "unknown"}
              {item.metadata?.namespace && (
                <Text color="gray">{item.metadata?.namespace}</Text>
              )}
            </Flex>
          ),
        },
        ...discovered,
        {
          name: "Age",
          render: (item: any) => {
            const duration = intervalToDuration({
              start: new Date(item.metadata?.creationTimestamp),
              end: new Date(),
            });
            return formatDuration(duration, {});
          },
        },
      ]);
    })();
  }, [resourceState]);
  return (
    <Flex direction="column">
      <Box>
        <TextField.Root
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          ref={ref}
          placeholder="mutex guard deez nuts"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="16" width="16" />
          </TextField.Slot>
        </TextField.Root>
      </Box>
      <ScrollArea style={{ width: "100%" }}>
        {resourceState.state === "loading" && (
          <Flex
            justify="center"
            align="center"
            style={{ height: "100%", width: "100%" }}
          >
            <Box>
              <Spinner size="3" />
              <Text>
                Loading {resource.version}/{resource.kind}...
              </Text>
            </Box>
          </Flex>
        )}
        {resourceState.state === "ready" && (
          <Table.Root size="1">
            <Table.Header>
              <Table.Row>
                {defaultRows.map((row) => (
                  <Tooltip content={row.help ?? "none"} key={row.name}>
                    <Table.ColumnHeaderCell>{row.name}</Table.ColumnHeaderCell>
                  </Tooltip>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {resourceState.resources
                .filter((r) => {
                  if (searchTerm === "") return true;
                  const term = searchTerm.toLowerCase();
                  return (
                    r.metadata?.name?.toLowerCase().includes(term) ||
                    (r.metadata?.namespace &&
                      r.metadata?.namespace.toLowerCase().includes(term)) ||
                    r.status?.phase?.toLowerCase().includes(term) ||
                    humanize(r).toLowerCase().includes(term)
                  );
                })
                .map((pod) => (
                  <Table.Row key={pod.metadata?.name}>
                    {defaultRows.map((row) => (
                      <Table.Cell key={row.name}>
                        {"render" in row
                          ? row.render(pod)
                          : JSON.stringify(
                              row.path
                                .split(".")
                                .reduce(
                                  (obj, key) => (obj ? obj[key] : "unknown"),
                                  pod
                                )
                            )}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
            </Table.Body>
          </Table.Root>
        )}
      </ScrollArea>
    </Flex>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let color: "red" | "green" | "yellow" | "gray" = "gray";
  if (status === "Running") color = "green";
  else if (status === "Pending") color = "yellow";
  else if (status === "Failed") color = "red";
  return <Badge color={color}>{status}</Badge>;
};
