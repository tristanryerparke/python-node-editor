import { memo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { JsonViewer as BaseJsonViewer } from "../ui/json-tree-viewer";

interface JsonViewerProps {
  data: any;
  className?: string;
  rootName?: string;
  textSize?: string;
  textLimit?: number;
}

export default memo(function JsonViewer({
  data,
  className,
  rootName = "",
  textSize,
  textLimit,
}: JsonViewerProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyFullJson = async () => {
    let copyText: string;
    try {
      copyText = JSON.stringify(data, null, 2);
    } catch {
      copyText = String(data);
    }

    await navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`relative p-2 ${className || ""}`}>
      <style>{`
        .json-viewer-tree button[title="Copy to clipboard"] {
          display: none !important;
        }
      `}</style>
      <button
        type="button"
        onClick={copyFullJson}
        className="absolute right-2 top-2 z-10 hover:bg-muted p-1 rounded"
        title="Copy full JSON"
      >
        {isCopied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      <BaseJsonViewer
        className="json-viewer-tree w-full h-full pr-6"
        data={data}
        rootName={rootName}
        defaultExpanded={true}
        textSize={textSize}
        textLimit={textLimit}
      />
    </div>
  );
});
