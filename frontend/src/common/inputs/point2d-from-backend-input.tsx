import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildApiPath } from "@/lib/fetcher";
import { ErrorDialog } from "../utility-components/error-dialog";
import UserModelDisplay from "../utility-components/user-model-display";
import { Crosshair, Loader2 } from "lucide-react";
import type { ControlledInputProps } from "../../components/custom-node/node-inputs/input-field-display";

export interface Point2DFromBackendInputProps extends ControlledInputProps {}

const Point2DFromBackendInput = memo(function Point2DFromBackendInput({
  value,
  onChange,
  disabled,
  expanded = false,
  typeSchema,
}: Point2DFromBackendInputProps) {
  const [retrieving, setRetrieving] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const typeName =
    typeof typeSchema === "string" ? typeSchema : "Point2DFromBackend";

  const handleRetrieve = async () => {
    setRetrieving(true);

    try {
      const response = await fetch(buildApiPath("/data/retrieve"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: typeName,
        }),
      });

      if (!response.ok) {
        let message = `Failed to retrieve data for type ${typeName}`;
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.detail === "string") {
            message = errorBody.detail;
          }
        } catch {
          // Ignore JSON parse errors and keep fallback message.
        }
        throw new Error(message);
      }

      const payload = await response.json();
      await onChange(payload, 0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve data";
      console.error("Error retrieving backend input data:", error);
      setErrorMessage(message);
      setShowErrorDialog(true);
    } finally {
      setRetrieving(false);
    }
  };

  return (
    <>
      <UserModelDisplay
        value={value}
        disabled={disabled}
        expanded={expanded}
        showEmptyTypeName={false}
        typeName={typeName}
        typeSchema={typeSchema}
        rightButton={(
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              void handleRetrieve();
            }}
            disabled={disabled || retrieving}
            aria-label="Retrieve input data"
          >
            {retrieving ? <Loader2 className="animate-spin" /> : <Crosshair />}
          </Button>
        )}
      />
      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Retrieve Failed"
        message={errorMessage}
      />
    </>
  );
});

export default Point2DFromBackendInput;
