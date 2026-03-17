import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import StringInput from "../common/inputs/string-input-new";
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
  onValueChange,
  onWidthChange,
  onHeightChange,
}: StringInputStoryArgs & {
  onValueChange: (value: string) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}) {
  return (
    <SyncedWidthHandleProvider
      useTailwindScale={true}
      width={width}
      setWidth={onWidthChange}
    >
      <ResizableHeightProvider height={height} setHeight={onHeightChange}>
        <div className="max-w-xl p-6">
          <StringInput
            value={value}
            onChange={onValueChange}
            onCommit={onValueChange}
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
        onValueChange={(value) => updateArgs({ value })}
        onWidthChange={(width) => updateArgs({ width })}
        onHeightChange={(height) => updateArgs({ height })}
      />
    );
  },
};
