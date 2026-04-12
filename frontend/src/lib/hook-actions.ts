import { buildApiPath } from "@/lib/fetcher";

export interface HookActionMessage {
  action: "add" | "delete";
  nodeId: string;
  callableId: string;
}

type HookActionNode = {
  id: string;
  data: Record<string, unknown>;
};

export function nodeToHookAction(
  node: HookActionNode,
  action: HookActionMessage["action"],
): HookActionMessage {
  const callableId = node.data.callableId;
  if (typeof callableId !== "string") {
    throw new Error(`Missing callableId for node ${node.id}`);
  }

  return {
    action,
    nodeId: node.id,
    callableId,
  };
}

export async function runHookActions(
  actions: HookActionMessage[],
): Promise<void> {
  if (actions.length === 0) {
    return;
  }

  const response = await fetch(buildApiPath("/hook_actions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(actions),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
