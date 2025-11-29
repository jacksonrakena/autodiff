import { atom, useAtomValue } from "jotai";
import { makeKubePath } from "./routes";
import { KubeUrlComponents } from "./routes";

export const kubernetesResourceAtom = atom<{
  [key: string]: any[];
}>({});

export const useKubernetesResourceCache = (key: string) => {
  const resourceAtom = atom(
    (get) => {
      const cache = get(kubernetesResourceAtom);
      return cache[key] || [];
    },
    (get, set, updateFn: (current: any[]) => any[]) => {
      const cache = get(kubernetesResourceAtom);
      set(kubernetesResourceAtom, {
        ...cache,
        [key]: updateFn(cache[key] || []),
      });
    }
  );
  return resourceAtom;
};
export const useCachedResource = (kubePathComponents: KubeUrlComponents) => {
  const cachedResources = useAtomValue(kubernetesResourceAtom);
  const resourceType = {
    ...kubePathComponents,
    name: "",
    namespace: "",
  };
  const resourcesOfType = cachedResources[makeKubePath(resourceType)];
  const resource = resourcesOfType.find(
    (e) =>
      e.metadata.name === kubePathComponents.name &&
      (kubePathComponents.namespace
        ? e.metadata.namespace === kubePathComponents.namespace
        : true)
  );
  return resource;
};
