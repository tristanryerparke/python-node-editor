"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  MoreHorizontal,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type JsonViewerProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  rootName?: string;
  defaultExpanded?: boolean;
  className?: string;
  textSize?: string;
  textLimit?: number;
  showArrayIndices?: boolean;
};

export function JsonViewer({
  data,
  rootName = "root",
  defaultExpanded = true,
  className,
  textSize = "text-sm",
  textLimit = 40,
  showArrayIndices = false,
}: JsonViewerProps) {
  return (
    <TooltipProvider>
      <div className={cn("font-mono", textSize, className)}>
        <JsonNode
          name={rootName}
          data={data}
          isRoot={true}
          defaultExpanded={defaultExpanded}
          textLimit={textLimit}
          showArrayIndices={showArrayIndices}
        />
      </div>
    </TooltipProvider>
  );
}

type JsonNodeProps = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  isRoot?: boolean;
  defaultExpanded?: boolean;
  level?: number;
  textLimit?: number;
  showArrayIndices?: boolean;
};

function JsonNode({
  name,
  data,
  isRoot = false,
  defaultExpanded = true,
  level = 0,
  textLimit = 40,
  showArrayIndices = false,
}: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [isCopied, setIsCopied] = React.useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const dataType =
    data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
  const isExpandable =
    data !== null &&
    data !== undefined &&
    !(data instanceof Date) &&
    (dataType === "object" || dataType === "array");
  const itemCount =
    isExpandable && data !== null && data !== undefined
      ? Object.keys(data).length
      : 0;
  const shouldRenderName = name.length > 0;
  const getChildName = (key: string) =>
    dataType === "array" && !showArrayIndices ? "" : key;

  // For root node, render outer braces/brackets without a root header label.
  if (isRoot && isExpandable && data !== null && data !== undefined) {
    return (
      <div>
        <div className="text-muted-foreground py-1">
          {dataType === "array" ? "[" : "{"}
        </div>
        {Object.keys(data).map((key) => (
          <JsonNode
            key={key}
            name={getChildName(key)}
            data={data[key]}
            level={0}
            defaultExpanded={defaultExpanded}
            textLimit={textLimit}
            showArrayIndices={showArrayIndices}
          />
        ))}
        <div className="text-muted-foreground py-1">
          {dataType === "array" ? "]" : "}"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("pl-2 group/object", level > 0 && "border-l border-border")}
    >
      <div
        className={cn(
          "flex items-center gap-1 py-1 hover:bg-muted/50 rounded px-1 -ml-2 cursor-pointer group/property",
          isRoot && "text-primary font-semibold",
        )}
        onClick={isExpandable ? handleToggle : undefined}
      >
        {isExpandable ? (
          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {shouldRenderName && <span className="text-primary">{name}</span>}

        <span className="text-muted-foreground">
          {isExpandable ? (
            <>
              {dataType === "array" ? "[" : "{"}
              {!isExpanded && (
                <span className="text-muted-foreground">
                  {" "}
                  {itemCount} {itemCount === 1 ? "item" : "items"}{" "}
                  {dataType === "array" ? "]" : "}"}
                </span>
              )}
            </>
          ) : shouldRenderName ? (
            ":"
          ) : null
          }
        </span>

        {!isExpandable && <JsonValue data={data} textLimit={textLimit} />}

        {!isExpandable && <div className="w-3.5" />}

        <button
          onClick={copyToClipboard}
          className="ml-auto opacity-0 group-hover/property:opacity-100 hover:bg-muted p-1 rounded"
          title="Copy to clipboard"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      {isExpandable && isExpanded && data !== null && data !== undefined && (
        <div className="pl-2">
          {Object.keys(data).map((key) => (
            <JsonNode
              key={key}
              name={getChildName(key)}
              data={data[key]}
              level={level + 1}
              defaultExpanded={defaultExpanded}
              textLimit={textLimit}
              showArrayIndices={showArrayIndices}
            />
          ))}
          <div className="text-muted-foreground pl-2 py-1">
            {dataType === "array" ? "]" : "}"}
          </div>
        </div>
      )}
    </div>
  );
}

// Update the JsonValue function to make the entire row clickable with an expand icon
function JsonValue({
  data,
  textLimit = 40,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  textLimit?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const dataType = typeof data;
  const TEXT_LIMIT = textLimit;

  if (data === null) {
    return <span className="text-rose-500">null</span>;
  }

  if (data === undefined) {
    return <span className="text-muted-foreground">undefined</span>;
  }

  if (data instanceof Date) {
    return <span className="text-purple-500">{data.toISOString()}</span>;
  }

  switch (dataType) {
    case "string":
      if (data.length > TEXT_LIMIT) {
        return (
          <div
            className="text-emerald-500 flex-1 flex items-center relative group cursor-pointer"
            style={{ flex: "0 1 auto", minWidth: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {`"`}
            {isExpanded ? (
              <span className="inline-block max-w-full wrap-break-word">
                {data}
              </span>
            ) : (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="inline-block truncate max-w-full">
                    {data.substring(0, TEXT_LIMIT)}...
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-md text-xs p-2 wrap-break-word"
                >
                  {data}
                </TooltipContent>
              </Tooltip>
            )}
            {`"`}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+4px)] opacity-0 group-hover:opacity-100 transition-opacity">
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      }
      return <span className="text-emerald-500">{`"${data}"`}</span>;
    case "number":
      return <span className="text-amber-500">{data}</span>;
    case "boolean":
      return <span className="text-blue-500">{data.toString()}</span>;
    default:
      return <span>{String(data)}</span>;
  }
}
