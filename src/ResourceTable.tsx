import {
  Box,
  Flex,
  DataList,
  Table,
  Badge,
  Text,
  ScrollArea,
  Tooltip,
} from "@radix-ui/themes";
import { useEffect, useMemo, useState } from "react";
import { http } from "./App";
import humanize from "@jsdevtools/humanize-anything";

import { intervalToDuration, formatDuration } from "date-fns";
import { RowType, discoverRows } from "./row-discovery";

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
  const [resources, setResources] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
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
        setResources(res.data.items);
        setDiscoveredRows([]);
      } else {
        console.error("Failed to fetch resources:", res.error);
      }
    })();
  }, [resource]);
  const [discoveredRows, setDiscoveredRows] = useState<RowType[] | null>(null);
  //   useEffect(() => {
  //     async () => {
  //       if (!discoveredRows && resources.length > 0) {
  //         const rows = await discoverRows(resource, resources[0]);
  //         console.log("Discovered rows:", rows);
  //         setDiscoveredRows(rows);
  //       }
  //     };
  //   }, [discoveredRows, resources, discoverRows]);
  const [defaultRows, setDefaultRows] = useState<RowType[]>([]);
  useEffect(() => {
    (async () => {
      const discovered =
        resources.length > 0 ? await discoverRows(resource, resources[0]) : [];
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
  }, [discoveredRows, resources]);
  //console.log(Object.keys(resources[0].status));
  return (
    <ScrollArea>
      <Flex gap="4" align="center">
        <DataList.Item>
          <DataList.Label minWidth="88px">Namespace</DataList.Label>
          <DataList.Value>All</DataList.Value>
        </DataList.Item>
      </Flex>

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
          {resources.map((pod) => (
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
          {/* {resources.map((pod) => (
            <Table.Row key={pod.metadata?.name}>
              <Table.RowHeaderCell>
                {pod.metadata?.name ?? "unknown"}
              </Table.RowHeaderCell>
              <Table.Cell>
                {pod.status?.containerStatuses
                  ? pod.status.containerStatuses
                      .map(
                        (cs) =>
                          `${cs.ready ? "✓" : "✗"} ${cs.name ?? "unknown"}`
                      )
                      .join(", ")
                  : "unknown"}
              </Table.Cell>
              <Table.Cell>
                <StatusBadge status={pod.status?.phase ?? "unknown"} />
              </Table.Cell>
              <Table.Cell>
                {pod.status?.containerStatuses
                  ?.map((e) => e.restartCount)
                  .reduce((a, b) => a + b, 0) ?? "unknown"}
              </Table.Cell>
            </Table.Row>
          ))} */}
        </Table.Body>
      </Table.Root>
    </ScrollArea>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let color: "red" | "green" | "yellow" | "gray" = "gray";
  if (status === "Running") color = "green";
  else if (status === "Pending") color = "yellow";
  else if (status === "Failed") color = "red";
  return <Badge color={color}>{status}</Badge>;
};
