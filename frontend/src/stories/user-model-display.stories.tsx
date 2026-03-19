import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import UserModelDisplay from "../common/utility-components/user-model-display";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";

type UserModelDisplayStoryArgs = ComponentProps<typeof UserModelDisplay> & {
  width?: number;
  height?: number;
};

const meta = {
  title: "Common/Utility Components/UserModelDisplay",
  component: UserModelDisplay,
  args: {
    value: {
      string: "alpha,beta,gamma",
      separator: ",",
    },
    disabled: false,
    expanded: false,
    typeName: "SplitStringInput",
    width: 80,
    height: 40,
  },
  argTypes: {
    value: {
      control: "object",
    },
    disabled: {
      control: "boolean",
    },
    expanded: {
      control: "boolean",
    },
    typeName: {
      control: "text",
    },
    width: {
      control: { type: "range", min: 20, max: 160, step: 1 },
    },
    height: {
      control: { type: "range", min: 30, max: 200, step: 1 },
    },
  },
} satisfies Meta<UserModelDisplayStoryArgs>;

export default meta;

type Story = StoryObj<UserModelDisplayStoryArgs>;

const renderUserModelDisplay = ({
  value,
  disabled = false,
  expanded = false,
  typeName,
  width = 80,
  height = 40,
}: UserModelDisplayStoryArgs) => (
  <SyncedWidthHandleProvider width={width}>
    <ResizableHeightProvider height={height} setHeight={() => {}}>
      <div>
        <UserModelDisplay
          value={value}
          disabled={disabled}
          expanded={expanded}
          typeName={typeName}
        />
      </div>
    </ResizableHeightProvider>
  </SyncedWidthHandleProvider>
);

export const Playground: Story = {
  args: {
    value: {
      "x": 0,
      "y": 1
    },
    disabled: false,
    expanded: false,
    typeName: "Point2d",
    width: 80,
    height: 40,
  },
  render: renderUserModelDisplay,
};
