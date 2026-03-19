import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import IntInput from "../common/inputs/int-input";

type IntInputStoryArgs = {
  disabled?: boolean;
  value?: number;
  valid?: boolean;
  placeholder?: string;
};

function IntInputStory({
  disabled = false,
  value = 2,
  valid = true,
  placeholder = "Index",
  onValueChange,
}: IntInputStoryArgs & {
  onValueChange: (value: number | undefined) => void;
}) {
  const [localValue, setLocalValue] = useState<number | undefined>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="w-80">
      <IntInput
        value={localValue}
        onChange={(nextValue) => {
          const nextNumberValue =
            typeof nextValue === "number" ? nextValue : undefined;
          setLocalValue(nextNumberValue);
          onValueChange(nextNumberValue);
        }}
        disabled={disabled}
        valid={valid}
        placeholder={placeholder}
      />
    </div>
  );
}

const meta = {
  title: "Common/Inputs/IntInput",
  args: {
    disabled: false,
    value: 2,
    valid: true,
    placeholder: "Index",
  },
  argTypes: {
    disabled: {
      control: "boolean",
    },
    value: {
      control: "number",
    },
    valid: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<IntInputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderIntInput: Story["render"] = (args) => {
  const [, updateArgs] = useArgs<IntInputStoryArgs>();

  return (
    <IntInputStory
      {...args}
      onValueChange={(value) => updateArgs({ value })}
    />
  );
};

export const Playground: Story = {
  args: {
    value: 2,
    placeholder: "Index",
  },
  render: renderIntInput,
};
