import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import FloatInput from "../common/inputs/float-input";

type FloatInputStoryArgs = {
  disabled?: boolean;
  value?: number;
  placeholder?: string;
};

function FloatInputStory({
  disabled = false,
  value,
  placeholder = "Enter float",
  onValueChange,
}: FloatInputStoryArgs & {
  onValueChange: (value: number | undefined) => void;
}) {
  const [localValue, setLocalValue] = useState<number | undefined>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="w-80">
      <FloatInput
        value={localValue}
        onChange={(nextValue) => {
          const nextNumberValue =
            typeof nextValue === "number" ? nextValue : undefined;
          setLocalValue(nextNumberValue);
          onValueChange(nextNumberValue);
        }}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

const meta = {
  title: "Common/Inputs/FloatInput",
  args: {
    disabled: false,
    value: 1.5,
    placeholder: "Enter float",
  },
  argTypes: {
    disabled: {
      control: "boolean",
    },
    value: {
      control: "number",
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<FloatInputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderFloatInput: Story["render"] = (args) => {
  const [, updateArgs] = useArgs<FloatInputStoryArgs>();

  return (
    <FloatInputStory
      {...args}
      onValueChange={(value) => updateArgs({ value })}
    />
  );
};

export const Playground: Story = {
  args: {
    value: 1.5,
  },
  render: renderFloatInput,
};
