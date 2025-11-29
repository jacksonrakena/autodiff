import { V1Pod } from "@kubernetes/client-node";
import { Badge } from "@radix-ui/themes";
import { formatKubeAge } from "../../../util/well-known-formatters";
import { MRT_ColumnDef } from "mantine-react-table";

export const WellKnownTableLayouts: {
  [key: string]: {
    columns: MRT_ColumnDef<any>[];
  };
} = {
  "/api/v1/pods": {
    columns: [
      {
        id: "ready",
        header: "Ready",
        accessorFn: (item: V1Pod) => {
          const total = item.status?.containerStatuses?.length || 0;
          const ready =
            item.status?.containerStatuses?.filter((cs) => cs.ready).length ||
            0;
          return { ready: ready, total: total };
        },
        //help: 'The number of ready containers for the pod. A pod is considered "Ready" when all containers are ready.',

        Cell: ({ row }) => {
          const total = row.original.status?.containerStatuses?.length || 0;
          const ready =
            row.original.status?.containerStatuses?.filter((cs) => cs.ready)
              .length || 0;
          const color = total === ready && total > 0 ? "green" : "red";
          return <Badge color={color}>{`${ready}/${total}`}</Badge>;
        },
        size: 80,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (item: V1Pod) =>
          item.metadata?.deletionTimestamp
            ? "Terminating"
            : item.status?.phase || "Unknown",
        Cell: ({ row, cell }) => {
          const status = (cell.getValue() as string) || "Unknown";
          let color: "red" | "green" | "yellow" | "gray" = "gray";
          if (status === "Running") color = "green";
          else if (status === "Pending") color = "yellow";
          else if (status === "Failed") color = "red";
          return <Badge color={color}>{status}</Badge>;
        },
        size: 100,
      },
      {
        id: "restarts",
        header: "Restarts",
        accessorFn: (item: V1Pod) =>
          item.status?.containerStatuses
            ?.map((e) => e.restartCount)
            .reduce((a, b) => a + b, 0) || 0,

        size: 80,
      },
      {
        id: "lastRestart",
        header: "Last Restart",
        accessorFn: (item: V1Pod) => {
          const restartTimes =
            item.status?.containerStatuses
              ?.map((cs) => cs.lastState?.terminated?.finishedAt)
              .filter((t): t is string => t !== undefined)
              .map((t) => new Date(t).getTime()) || [];
          if (restartTimes.length === 0) return null;
          return new Date(Math.max(...restartTimes));
        },
        Cell: ({ row }) => {
          const restartTimes =
            row.original.status?.containerStatuses
              ?.map((cs) => cs.lastState?.terminated?.finishedAt)
              .filter((t): t is string => t !== undefined)
              .map((t) => new Date(t).getTime()) || [];
          if (restartTimes.length === 0) {
            return <></>;
          }
          return <>{formatKubeAge(new Date(Math.max(...restartTimes)))}</>;
        },
        size: 80,
      },
      {
        id: "lastRestartReason",
        header: "Last Restart Reason",
        accessorFn: (item: V1Pod) => {
          const restartReasons =
            item.status?.containerStatuses
              ?.map((cs) => cs.lastState?.terminated)
              .filter((t) => !!t) ?? [];
          return restartReasons.length > 0 ? restartReasons : null;
        },
        Cell: ({ row }) => {
          const restartReasons =
            row.original.status?.containerStatuses
              ?.map((cs) => cs.lastState?.terminated)
              .filter((t) => !!t) ?? [];
          if (restartReasons.length === 0) {
            return <></>;
          }
          return (
            <>
              {restartReasons
                .map((r) => `${r.reason} (${r.exitCode})`)
                .join(", ")}
            </>
          );
        },
      },
      {
        id: "node",
        header: "Node",
        accessorFn: (item: V1Pod) => item.spec?.nodeName || "Unknown",
        size: 120,
      },
    ],
  },
  "/api/v1/namespaces": {
    columns: [
      {
        id: "phase",
        header: "Phase",
        accessorFn: (item: any) => item.status?.phase || "Unknown",
        Cell: ({ row }) => {
          const phase = row.original.status?.phase || "Unknown";
          let color: "red" | "green" | "yellow" | "gray" = "gray";
          if (phase === "Active") color = "green";
          else if (phase === "Terminating") color = "yellow";
          return <Badge color={color}>{phase}</Badge>;
        },
      },
    ],
  },
};
