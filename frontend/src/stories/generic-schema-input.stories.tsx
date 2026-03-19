import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import GenericSchemaInput from "../common/inputs/generic-schema-input";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import type { TypeExpr } from "@/types/backend-schema";

type GenericSchemaInputStoryArgs = {
  expanded?: boolean;
  disabled?: boolean;
  value?: unknown;
  valid?: boolean;
  placeholder?: string;
  schema?: TypeExpr;
  width?: number;
  height?: number;
};

function GenericSchemaInputStory({
  expanded = false,
  disabled = false,
  value = ["alpha", "beta", "gamma"],
  valid = true,
  placeholder = "list[str]",
  schema = {
    structureType: "list",
    itemsType: "str",
  },
  width = 80,
  height = 40,
  onWidthChange,
  onHeightChange,
  onValueChange,
}: GenericSchemaInputStoryArgs & {
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onValueChange: (value: unknown) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <SyncedWidthHandleProvider
      width={width}
      setWidth={onWidthChange}
    >
      <ResizableHeightProvider height={height} setHeight={onHeightChange}>
        <div>
          <GenericSchemaInput
            value={localValue}
            onChange={(nextValue) => {
              setLocalValue(nextValue);
              onValueChange(nextValue);
            }}
            disabled={disabled}
            valid={valid}
            expanded={expanded}
            placeholder={placeholder}
            schema={schema}
          />
        </div>
      </ResizableHeightProvider>
    </SyncedWidthHandleProvider>
  );
}

const meta = {
  title: "Common/Inputs/GenericSchemaInput",
  args: {
    expanded: true,
    disabled: false,
    value: ["alpha", "beta", "gamma"],
    valid: true,
    placeholder: "list[str]",
    schema: {
      structureType: "list",
      itemsType: "str",
    },
    width: 80,
    height: 40,
  },
  argTypes: {
    expanded: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    value: {
      control: "object",
    },
    valid: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
    schema: {
      control: "object",
    },
    width: {
      control: { type: "range", min: 20, max: 160, step: 1 },
    },
    height: {
      control: { type: "range", min: 30, max: 200, step: 1 },
    },
  },
} satisfies Meta<GenericSchemaInputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderGenericSchemaInput: Story["render"] = (args) => {
  const [, updateArgs] = useArgs<GenericSchemaInputStoryArgs>();

  return (
    <GenericSchemaInputStory
      {...args}
      onWidthChange={(width) => updateArgs({ width })}
      onHeightChange={(height) => updateArgs({ height })}
      onValueChange={(value) => updateArgs({ value })}
    />
  );
};

export const Playground: Story = {
  args: {
    value: ["alpha", "beta", "gamma"],
    schema: {
      structureType: "list",
      itemsType: "str",
    },
    width: 80,
    height: 40,
  },
  render: renderGenericSchemaInput,
};
