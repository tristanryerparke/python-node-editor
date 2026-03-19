import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import ImageOutput from "../common/outputs/image-output";
import { SyncedWidthHandleProvider } from "@/common/utility-components/synced-width-resizable";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import type { CachedValueReference } from "@/types/types";

const SAMPLE_IMAGE_PREVIEW =
  "UklGRpIAAABXRUJQVlA4IIYAAAAQBgCdASoYABgAPo04mEelIyKhN/VYAKARiWwAnTKEgQjRiAPUBtgADldxYQGf5UH2lR0quJ7VseAA/vph5zM0w396vylFib6CGg7B9L647m5fy03sjRC9I4u8F6LXFBZ+PVcBYFqPWmUdG9igEjpWTUJiUg0kj7gzBGE9tSttjowNoWzgAA==";

type ImageOutputStoryArgs = {
  expanded?: boolean;
  value?: CachedValueReference | null;
  width?: number;
  height?: number;
};

function ImageOutputStory({
  expanded = false,
  value = null,
  width = 80,
  height = 60,
  onWidthChange,
  onHeightChange,
}: ImageOutputStoryArgs & {
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
          <ImageOutput value={value} expanded={expanded} />
        </div>
      </ResizableHeightProvider>
    </SyncedWidthHandleProvider>
  );
}

const meta = {
  title: "Common/Outputs/ImageOutput",
  args: {
    expanded: false,
    value: {
      cacheKey: "storybook-preview",
      displayName: "Generated Image",
      preview: SAMPLE_IMAGE_PREVIEW,
    },
    width: 80,
    height: 60,
  },
  argTypes: {
    expanded: {
      control: "boolean",
    },
    value: {
      control: "object",
    },
    width: {
      control: { type: "range", min: 20, max: 160, step: 1 },
    },
    height: {
      control: { type: "range", min: 30, max: 200, step: 1 },
    },
  },
} satisfies Meta<ImageOutputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderImageOutput: Story["render"] = (args) => {
  const [, updateArgs] = useArgs<ImageOutputStoryArgs>();

  return (
    <ImageOutputStory
      {...args}
      onWidthChange={(width) => updateArgs({ width })}
      onHeightChange={(height) => updateArgs({ height })}
    />
  );
};

export const Playground: Story = {
  args: {
    value: {
      cacheKey: "storybook-preview",
      displayName: "Generated Image",
      preview: SAMPLE_IMAGE_PREVIEW,
    },
    width: 80,
    height: 60,
  },
  render: renderImageOutput,
};

export const NoImage: Story = {
  args: {
    expanded: false,
    value: null,
    width: 80,
    height: 60,
  },
  render: renderImageOutput,
};

export const Expanded: Story = {
  args: {
    expanded: true,
    value: {
      cacheKey: "storybook-preview",
      displayName: "Gradient Preview",
      preview: SAMPLE_IMAGE_PREVIEW,
    },
    width: 80,
    height: 60,
  },
  render: renderImageOutput,
};
