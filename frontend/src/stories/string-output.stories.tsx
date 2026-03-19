import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import StringOutput from "../common/outputs/string-output";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";

type StringOutputStoryArgs = {
  expanded?: boolean;
  value?: string;
  width?: number;
  height?: number;
};

function StringOutputStory({
  expanded = false,
  value = "",
  width = 80,
  height = 30,
  onWidthChange,
  onHeightChange,
}: StringOutputStoryArgs & {
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}) {
  return (
    <SyncedWidthHandleProvider
      width={width}
      setWidth={onWidthChange}
    >
      <ResizableHeightProvider height={height} setHeight={onHeightChange}>
        <div>
          <StringOutput value={value} expanded={expanded} />
        </div>
      </ResizableHeightProvider>
    </SyncedWidthHandleProvider>
  );
}

const meta = {
  title: "Common/Outputs/StringOutput",
  args: {
    expanded: false,
    value: "Storybook text",
    width: 80,
    height: 30,
  },
  argTypes: {
    expanded: {
      control: "boolean",
    },
    value: {
      control: "text",
    },
    width: {
      control: { type: "range", min: 20, max: 160, step: 1 },
    },
    height: {
      control: { type: "range", min: 30, max: 200, step: 1 },
    },
  },
} satisfies Meta<StringOutputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderStringOutput: Story["render"] = (args) => {
  const [, updateArgs] = useArgs<StringOutputStoryArgs>();

  return (
    <StringOutputStory
      {...args}
      onWidthChange={(width) => updateArgs({ width })}
      onHeightChange={(height) => updateArgs({ height })}
    />
  );
};

export const Playground: Story = {
  args: {
    value: "Storybook text",
    width: 80,
    height: 30,
  },
  render: renderStringOutput,
};

export const Empty: Story = {
  args: {
    expanded: false,
    value: "",
    width: 80,
    height: 30,
  },
  render: renderStringOutput,
};

export const Expanded: Story = {
  args: {
    expanded: true,
    value:
      "alpha\nbeta\ngamma\ndelta\nepsilon\nzeta\neta\ntheta\niota\nkappa\nlambda",
    width: 80,
    height: 50,
  },
  render: renderStringOutput,
};
