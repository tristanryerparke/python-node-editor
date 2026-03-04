import { describe, expect, it } from "vitest";
import type { Edge } from "@xyflow/react";
import type { FrontendFieldDataWrapper, FunctionNode } from "@/types/types";
import { getInvalidNodeInputIssues } from "./input-execution-validation";

function makeNode(
  id: string,
  args: Record<string, FrontendFieldDataWrapper>,
): FunctionNode {
  return {
    id,
    type: "customNode",
    position: { x: 0, y: 0 },
    data: {
      name: id,
      callableId: id,
      category: [],
      definitionPath: "",
      arguments: args,
      outputs: {},
    },
  } as FunctionNode;
}

describe("getInvalidNodeInputIssues", () => {
  it("returns no issues for valid unconnected inputs", () => {
    const node = makeNode("n1", {
      values: {
        type: { structureType: "list", itemsType: "int" },
        value: [1, 2],
      } as unknown as FrontendFieldDataWrapper,
    });

    const issues = getInvalidNodeInputIssues([node], []);
    expect(issues).toEqual([]);
  });

  it("flags invalid stored raw input for list schema", () => {
    const node = makeNode("n1", {
      values: {
        type: { structureType: "list", itemsType: "int" },
        value: '[1, "a"]',
      } as unknown as FrontendFieldDataWrapper,
    });

    const issues = getInvalidNodeInputIssues([node], []);
    expect(issues.length).toBe(1);
    expect(issues[0]).toMatchObject({
      nodeId: "n1",
      inputName: "values",
    });
  });

  it("flags union mismatch against selected type", () => {
    const node = makeNode("n1", {
      maybe_number: {
        type: { anyOf: ["int", "str"] },
        _selectedType: "int",
        value: "hello",
      } as unknown as FrontendFieldDataWrapper,
    });

    const issues = getInvalidNodeInputIssues([node], []);
    expect(issues.length).toBe(1);
    expect(issues[0]).toMatchObject({
      nodeId: "n1",
      inputName: "maybe_number",
    });
  });

  it("skips invalid inputs that are connected", () => {
    const node = makeNode("n1", {
      values: {
        type: { structureType: "list", itemsType: "int" },
        value: '[1, "a"]',
      } as unknown as FrontendFieldDataWrapper,
    });

    const edges: Edge[] = [
      {
        id: "e1",
        source: "n0",
        target: "n1",
        sourceHandle: "n0:outputs:x:handle",
        targetHandle: "n1:arguments:values:handle",
      } as Edge,
    ];

    const issues = getInvalidNodeInputIssues([node], edges);
    expect(issues).toEqual([]);
  });
});
