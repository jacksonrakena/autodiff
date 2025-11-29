import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { type KubeUrlComponents } from "./util/kube";

export interface ResourceWithId {
  metadata: {
    uid: string;
  };
}

type InternalSubscriptionEvent<T> = {
  event: "apply" | "delete" | "initApply";
  data: { resource: T };
};

export const useResourceSubscription = <T,>(
  resource: KubeUrlComponents,
  callback: (event: InternalSubscriptionEvent<T>) => void
) => {
  useEffect(() => {
    const subscriptionId = Math.floor(Math.random() * 99999999);
    const subscription = {
      ...resource,
      subscriptionId: subscriptionId,
    };
    const channel = new Channel<InternalSubscriptionEvent<T>>();
    channel.onmessage = (msg) => {
      callback(msg);
    };

    console.log("Listening for updates", subscription);
    invoke("start_listening", {
      ...subscription,
      apiVersion: resource.api_version,
      resourcePlural: resource.resource_plural,
      channel,
    });
    return () => {
      console.log("Closing updates on ", subscription);
      invoke("stop_listen_task", { taskId: subscriptionId });
      channel.onmessage = () => {};
    };
  }, [resource]);
};

export type ResourceListState<T extends ResourceWithId> = {
  resources: T[];
  lastEventTime: Date | null;
};
export const useResourceList = <T extends ResourceWithId>(
  resourceType: KubeUrlComponents
) => {
  const [resources, setResources] = useState<T[]>([]);
  const [lastTime, setLastTime] = useState<Date | null>(null);
  useEffect(() => {
    setResources([]);
    setLastTime(new Date());
  }, [resourceType]);
  useResourceSubscription<T>(resourceType, (event) => {
    setLastTime(new Date());
    switch (event.event) {
      case "initApply":
        setResources((prev) => [...prev, event.data.resource]);
        break;
      case "apply":
        setResources((prev) => [
          ...prev.filter(
            (e) => e.metadata.uid !== event.data.resource.metadata.uid
          ),
          event.data.resource,
        ]);
        break;
      case "delete":
        setResources((prev) =>
          prev.filter(
            (e) => e.metadata.uid !== event.data.resource.metadata.uid
          )
        );
        break;
    }
  });
  return { resources, lastEventTime: lastTime };
};
