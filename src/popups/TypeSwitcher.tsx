import { Callout, Code, Dialog, Flex, TextField, Text } from "@radix-ui/themes";
import { ResourceType } from "../types";
import { useEffect, useMemo, useState } from "react";
import { InfoCircledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { useKeyPress } from "../util/keybinds";
import { http } from "../util/kube/requests";

const tryResolveResourceType = (
  word: string,
  resourceTypes: ResourceType[]
) => {
  for (const rt of resourceTypes) {
    if (
      rt.kind.toLowerCase() === word.toLowerCase() ||
      rt.plural.toLowerCase() === word.toLowerCase()
    ) {
      return rt;
    }
  }
  return null;
};

const resolve = async (
  rawQuery: string,
  resourceTypes: ResourceType[]
): Promise<ComputeState> => {
  const query = rawQuery.replace(":", "").toLowerCase();
  const tokens = query.split(" ");
  if (tokens.length === 1) {
    // Likely a resource type jump action
    const trt = tryResolveResourceType(query, resourceTypes);
    if (trt) {
      return { action: "resource_type", target: trt };
    }
    return { action: "none_found" };
  }
  if (tokens.length === 2) {
    const trt = tryResolveResourceType(tokens[0], resourceTypes);
    if (!trt) return { action: "none_found" };

    const path = trt.group
      ? `/apis/${trt.group}/${trt.version}/${trt.plural.toLowerCase()}/${
          tokens[1]
        }`
      : `/api/${trt.version}/${trt.plural.toLowerCase()}/${tokens[1]}`;
    console.log("init resource query ", path);
    try {
      const result = await http<any>(path);
      if (result.success) {
        console.log(`found ${trt.kind} ${tokens[1]}`, result.data);
        return {
          action: "resource",
          target: result.data.metadata.name,
          type: trt,
        };
      }
    } catch (e) {
      return { action: "none_found" };
    }
    return { action: "none_found" };
  }
  return { action: "none_found" };
};

type ComputeState =
  | { action: "resource_type"; target: ResourceType }
  | { action: "loading" }
  | { action: "resource"; target: string; type: ResourceType }
  | { action: "none_found" }
  | null;
export const TypeSwitcher = ({
  isOpen,
  onClose,
  onAction,
  resourceTypes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: ComputeState) => void;
  resourceTypes: ResourceType[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [computed, setComputed] = useState<ComputeState>(null);
  useEffect(() => {
    (async () => {
      setComputed({ action: "loading" });
      const result = await resolve(searchTerm, resourceTypes);
      setComputed(result);
    })();
  }, [searchTerm, resourceTypes]);
  useKeyPress(
    "Enter",
    () => {
      if (computed && !["none_found", "loading"].includes(computed.action)) {
        onAction(computed);
      }
    },
    { noEffectWhileInTextInput: false }
  );
  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Content size="2" maxWidth="300px">
        {isOpen && (
          <Flex direction="column" gap="2" mb="4">
            <TextField.Root
              placeholder="Jump to a resource type or resource"
              onChange={(e) => {
                if (e.currentTarget.value === "") {
                  onClose();
                } else {
                  setSearchTerm(e.currentTarget.value);
                }
              }}
              onBlur={() => {
                setSearchTerm("");
              }}
              value={searchTerm}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
            {computed && (
              <>
                {computed.action === "none_found" && (
                  <Text>No results found</Text>
                )}
                {computed.action === "resource_type" && (
                  <Callout.Root color="gold">
                    <Callout.Icon>
                      <InfoCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      <Code>
                        {computed.target.group} {computed.target.version}{" "}
                        {computed.target.kind}
                      </Code>
                    </Callout.Text>
                  </Callout.Root>
                )}
                {computed.action === "loading" && <Text>Loading...</Text>}
                {computed.action === "resource" && (
                  <Callout.Root color="green">
                    <Callout.Icon>
                      <InfoCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      <Code>{computed.target}</Code>
                    </Callout.Text>
                  </Callout.Root>
                )}
              </>
            )}
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};
