import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import UserModelDisplay from "../common/inputs/user-model-display";

type UserModelDisplayStoryArgs = ComponentProps<typeof UserModelDisplay>;

const meta = {
  title: "Common/Inputs/UserModelDisplay",
  component: UserModelDisplay,
  args: {
    value: {
      string: "alpha,beta,gamma",
      separator: ",",
    },
    disabled: false,
    typeName: "SplitStringInput",
  },
  argTypes: {
    value: {
      control: "object",
    },
    disabled: {
      control: "boolean",
    },
    typeName: {
      control: "text",
    },
  },
} satisfies Meta<UserModelDisplayStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderUserModelDisplay = ({
  value,
  disabled = false,
  typeName,
}: UserModelDisplayStoryArgs) => (
  <div className="w-80">
    <UserModelDisplay
      value={value}
      disabled={disabled}
      typeName={typeName}
    />
  </div>
);

export const Playground: Story = {
  args: {
    value: {
      "x": 0,
      "y": 1
    },
    disabled: false,
    typeName: "Point2d",
  },
  render: renderUserModelDisplay,
};
