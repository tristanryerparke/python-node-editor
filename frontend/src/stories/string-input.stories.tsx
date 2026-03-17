import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import StringInput from "../common/inputs/string-input";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";

type StringInputStoryArgs = {
  expanded?: boolean;
  disabled?: boolean;
  value?: string;
  valid?: boolean;
  width?: number;
  height?: number;
};

function StringInputStory({
  expanded = false,
  disabled = false,
  value = "",
  valid = true,
  width = 72,
  height = 30,
  onWidthChange,
  onHeightChange,
  onValueChange,
}: StringInputStoryArgs & {
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onValueChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <SyncedWidthHandleProvider
      useTailwindScale={true}
      width={width}
      setWidth={onWidthChange}
    >
      <ResizableHeightProvider height={height} setHeight={onHeightChange}>
        <div>
          <StringInput
            value={localValue}
            onChange={(nextValue) => {
              const nextStringValue = nextValue as string;
              setLocalValue(nextStringValue);
              onValueChange(nextStringValue);
            }}
            disabled={disabled}
            valid={valid}
            expanded={expanded}
          />
        </div>
      </ResizableHeightProvider>
    </SyncedWidthHandleProvider>
  );
}

const meta = {
  title: "Common/Inputs/StringInput",
  args: {
    expanded: false,
    disabled: false,
    value: "Storybook text",
    valid: true,
    width: 72,
    height: 30,
  },
  argTypes: {
    expanded: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    value: {
      control: "text",
    },
    valid: {
      control: "boolean",
    },
    width: {
      control: { type: "range", min: 20, max: 160, step: 1 },
    },
    height: {
      control: { type: "range", min: 30, max: 200, step: 1 },
    },
  },
} satisfies Meta<StringInputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    value: "",
    width: 80,
    height: 40
  },

  render: function Render(args: StringInputStoryArgs) {
    const [, updateArgs] = useArgs<StringInputStoryArgs>();

    return (
      <StringInputStory
        expanded={args.expanded}
        disabled={args.disabled}
        value={args.value}
        valid={args.valid}
        width={args.width}
        height={args.height}
        onWidthChange={(width) => updateArgs({ width })}
        onHeightChange={(height) => updateArgs({ height })}
        onValueChange={(value) => updateArgs({ value })}
      />
    );
  }
};

export const TextOverflow: Story = {
  args: {
    expanded: true,
    disabled: false,
    value: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    valid: true,
    width: 80,
    height: 40
  },

  render: function Render(args: StringInputStoryArgs) {
    const [, updateArgs] = useArgs<StringInputStoryArgs>();

    return (
      <StringInputStory
        expanded={args.expanded}
        disabled={args.disabled}
        value={args.value}
        valid={args.valid}
        width={args.width}
        height={args.height}
        onWidthChange={width => updateArgs({
          width
        })}
        onHeightChange={height => updateArgs({
          height
        })}
        onValueChange={value => updateArgs({
          value
        })} />
    );
  }
};
