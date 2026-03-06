# Custom Input Components

This guide explains how to create custom input components for node fields using the `useInputField` hook.

## Overview

Every input component in the node editor receives two props and uses the `useInputField` hook to interact with the node data store. The hook handles:

- **Store updates** — writing values back to the node
- **Connection detection** — disabling the input when a wire is connected
- **Debounced local state** — letting the user type without lag while batching store writes

Your component is responsible for rendering the UI and (optionally) validating the value for display purposes.

## Required Props

All input components must accept `CustomInputProps`:

```tsx
import { type CustomInputProps } from "@/hooks/useInputField";

function MyInput({ inputData, path }: CustomInputProps) {
  // ...
}
```

| Prop | Type | Description |
|------|------|-------------|
| `inputData` | `FrontendFieldDataWrapper` | The field's current data including `type` and `value` |
| `path` | `(string \| number)[]` | Path to this field in the node data tree (e.g. `[nodeId, "arguments", "fieldName"]`) |

## The `useInputField` Hook

```tsx
import { useInputField } from "@/hooks/useInputField";

const { value, setValue, disabled } = useInputField<T>(
  inputData,
  path,
  options?,
);
```

### Return Values

| Return | Type | Description |
|--------|------|-------------|
| `value` | `T` | The current local display value, tracks user input responsively (ahead of the store during typing). |
| `setValue` | `(value: T, debounce?: number) => Promise<void>` | Set a new value. By default debounces the store write (200ms). Pass `0` for an immediate write. Returns a `Promise` so async workflows (e.g. file uploads) can `await` it. |
| `disabled` | `boolean` | `true` when the port has an incoming connection — the input should be non-interactive. |

### `setValue` debounce parameter

| Call | Behavior |
|------|----------|
| `setValue(val)` | Updates local state immediately, debounced store write (default delay). |
| `setValue(val, 0)` | Updates local state immediately, writes to store immediately. Cancels any pending debounce. Use for `onBlur` and async operations. |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delay` | `number` | `200` | Default debounce delay in milliseconds. |

## Examples

### Debounced Text Input

A simple text input that debounces user keystrokes:

```tsx
import { memo } from "react";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";

export default memo(function MyTextInput({ inputData, path }: CustomInputProps) {
  const { value, setValue, disabled } = useInputField<string>(inputData, path);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setValue(value, 0)}
        disabled={disabled}
        className="nodrag nopan nowheel"
        placeholder="Enter text"
      />
    </div>
  );
});
```

**Key points:**
- `setValue` updates the local state on each keystroke and debounces the store write.
- `setValue(value, 0)` on blur ensures the final value is committed even if the debounce hasn't fired yet.
- Any display conversion (e.g. handling `null`) is done inline in the JSX.

### Debounced Number Input with Preprocessing

An integer input that rounds values before storing:

```tsx
import { memo, useCallback, useMemo } from "react";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { validateValueAgainstSchema } from "@/utils/schema-input-validator";

export default memo(function IntInput({ inputData, path }: CustomInputProps) {
  const { value, setValue, disabled } = useInputField<number | undefined>(inputData, path);

  // Preprocessing: round to integer before setting
  const handleChange = useCallback(
    (v: number | undefined) => setValue(v !== undefined ? Math.round(v) : undefined),
    [setValue],
  );

  const valid = useMemo(() => {
    if (value === undefined) return true;
    return validateValueAgainstSchema(value, inputData.type).valid;
  }, [inputData.type, value]);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : undefined)}
        onBlur={() => setValue(value, 0)}
        disabled={disabled}
        style={{ borderColor: valid ? undefined : "red" }}
        placeholder="Enter integer"
      />
    </div>
  );
});
```

**Key points:**
- `Math.round` is applied inline as a preprocessing step — the hook doesn't need transform options.
- Validation is done in the component to show a red border — the hook still sends the value to the store regardless.

### Immediate Mode (File Upload)

For inputs that don't need debouncing — like file uploaders — use `setValue(value, 0)` for immediate writes:

```tsx
import { memo, useState } from "react";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";

export default memo(function FileInput({ inputData, path }: CustomInputProps) {
  const { setValue, disabled } = useInputField(inputData, path);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await setValue(file, 0);
    } catch {
      console.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (disabled) {
    return <span>Connected</span>;
  }

  return (
    <input
      type="file"
      onChange={handleFileChange}
      disabled={uploading}
    />
  );
});
```

**Key points:**
- `setValue(file, 0)` writes immediately to the store with no debounce.
- The `Promise` returned by `setValue` lets you `await` it for upload workflows.
- The store's large-data handling (e.g. for `Image` cached types) is automatic.

## Registering Your Component

After creating your component, register it in `frontend/src/components/custom-node/inputs/input-type-registry.ts`:

```ts
import MyInput from "../../../common/leaf-inputs/my-input";

export const INPUT_TYPE_COMPONENT_REGISTRY: Record<string, ComponentRegistryEntry> = {
  // ... existing entries
  MyTypeName: { main: MyInput },
};
```

The key (`MyTypeName`) must match the Python type name that your backend function uses. For example, if your Python function has `def process(data: MyTypeName)`, register under `"MyTypeName"`.

## Important CSS Classes

When rendering inputs inside nodes, always add these CSS classes to prevent the canvas from capturing mouse events:

- `nodrag` — prevents node dragging when interacting with the input
- `nopan` — prevents canvas panning
- `nowheel` — prevents canvas zooming on scroll

```tsx
<div className="flex flex-1 min-w-35 nodrag nopan nowheel">
  <input className="nodrag nopan nowheel" />
</div>
```

## Validation

Validation is **not handled by the hook** — it's a component responsibility. The hook sends all values to the store regardless of validity. This means:

1. Validate the current `value` in your component (e.g. with `useMemo`)
2. Use the result for UI feedback (red borders, error messages, etc.)
3. Invalid values still flow to the store and can be corrected later

Built-in validators are available in `@/utils/schema-input-validator`:

```tsx
import { validateValueAgainstSchema } from "@/utils/schema-input-validator";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";

// For already-parsed values (numbers, booleans, etc.)
validateValueAgainstSchema(42, inputData.type);
// → { valid: true, value: 42 }

// For raw string input (parses JSON first, then validates)
validateInputAgainstSchema('"hello"', inputData.type);
// → { valid: true, value: "hello" }
```

## Summary

| Scenario | Use |
|----------|-----|
| Text/number input with typing | `setValue(val)` — debounced by default; `setValue(val, 0)` on blur |
| Preprocess before storing | Wrap in a preprocessing function inline (e.g. `Math.round`) |
| File upload / async operation | `await setValue(file, 0)` — immediate write |
| Disable when connected | Always use `disabled` from the hook return |
| Show validation errors | Validate `value` in the component, use result for UI only |
