import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useMemo } from "react";
import { useKeyPress } from "../util/keybinds";
import { TypeSwitcher } from "./TypeSwitcher";

export const QuickSwitch = () => {
  useKeyPress(
    "Escape",
    () => {
      if (isQuickSwitchShown) setIsQuickSwitchShown(false);
    },
    { noEffectWhileInTextInput: false }
  );
  const [isQuickSwitchShown, setIsQuickSwitchShown] = useState(false);

  type ApiGroup = {
    name: string;
    version: string;
    resources: { kind: string; plural: string; api_version: string }[];
  };

  const [apiResources, setApiResources] = useState<ApiGroup[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const api = await invoke("list_api_resources");
        setApiResources(api as ApiGroup[]);
      } catch (e) {
        console.error("Failed to fetch API resources:", e);
      }
    })();
  }, []);
  const filteredApiGroups = useMemo(() => {
    const n = [...apiResources];
    n.sort((a, b) => {
      if (a.name.length === 0) return -1;
      return a.name.localeCompare(b.name);
    });
    return n.map((e) => {
      if (!e.name) {
        return {
          ...e,
          name: "Core",
        };
      }
      return e;
    });
  }, [apiResources]);
  return (
    <TypeSwitcher
      isOpen={isQuickSwitchShown}
      onClose={() => setIsQuickSwitchShown(false)}
      resourceTypes={filteredApiGroups.flatMap((group) => {
        return group.resources.map((resource) => ({
          kind: resource.kind,
          group: group.name === "Core" ? "" : group.name,
          plural: resource.plural,
          version: group.version,
          api_version: resource.api_version,
        }));
      })}
      onAction={(action) => {
        if (action?.action === "resource_type") {
          //setSelectedResource(action.target);
        }
        setIsQuickSwitchShown(false);
      }}
    />
  );
};
