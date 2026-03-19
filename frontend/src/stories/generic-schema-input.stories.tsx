import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import GenericSchemaInput from "../common/inputs/generic-schema-input";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import type { TypeSchema } from "@/types/backend-schema";
import useFlowStore from "@/stores/flowStore";
import type { TypeInfo } from "@/types/environment";

type GenericSchemaInputStoryArgs = {
  expanded?: boolean;
  disabled?: boolean;
  value?: unknown;
  placeholder?: string;
  schema?: TypeSchema;
  mockTypes?: Record<string, TypeInfo>;
  width?: number;
  height?: number;
};

const POINT2D_TYPE: Record<string, TypeInfo> = {
  Point2D: {
    kind: "user_model",
    category: ["stories"],
    properties: {
      x: "float",
      y: "float",
    },
  },
};

function GenericSchemaInputStory({
  expanded = false,
  disabled = false,
  value = ["alpha", "beta", "gamma"],
  placeholder = "list[str]",
  schema = {
    structureType: "list",
    itemsType: "str",
  },
  mockTypes,
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

  useEffect(() => {
    if (!mockTypes) {
      return;
    }

    const previousTypes = useFlowStore.getState().types;
    useFlowStore.setState({
      types: {
        ...previousTypes,
        ...mockTypes,
      },
    });

    return () => {
      useFlowStore.setState({ types: previousTypes });
    };
  }, [mockTypes]);

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
    placeholder: {
      control: "text",
    },
    schema: {
      control: "object",
    },
    mockTypes: {
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

export const InvalidJSON: Story = {
  args: {
    expanded: true,
    disabled: false,
    value: "[\"alpha\",\"beta\",\"gamma\"",
    placeholder: "list[str]",

    schema: {
      "structureType": "list",
      "itemsType": "str"
    },

    width: 80,
    height: 40
  },

  render: renderGenericSchemaInput
};

export const InvalidType: Story = {
  args: {
    expanded: true,
    disabled: false,
    value: "[\"alpha\",\"beta\",0]",
    placeholder: "list[str]",

    schema: {
      "structureType": "list",
      "itemsType": "str"
    },

    width: 80,
    height: 40
  },

  render: renderGenericSchemaInput
};

export const UserModel: Story = {
  args: {
    expanded: true,
    disabled: false,
    value: {
      x: 7,
      y: 10,
    },
    placeholder: "Point2D",
    schema: "Point2D",
    mockTypes: POINT2D_TYPE,
    width: 80,
    height: 56,
  },
  render: renderGenericSchemaInput,
};

export const InvalidUserModel: Story = {
  args: {
    expanded: true,
    disabled: false,
    value: "{\"x\":7,\"y\":\"bad\"}",
    placeholder: "Point2D",
    schema: "Point2D",
    mockTypes: POINT2D_TYPE,
    width: 80,
    height: 56,
  },
  render: renderGenericSchemaInput,
};
