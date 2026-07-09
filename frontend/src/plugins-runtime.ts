import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import { toast } from "sonner";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "./common/utility-components/resizable-height";
import { SyncedWidthHandle } from "./common/utility-components/synced-width-resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "t-components/dialog";
import { Button } from "t-components/button";
import {
  registerInputRenderer,
  registerLargeDataSerializer,
  registerOutputRenderer,
} from "./plugin-api";

export interface FrontendPluginDescriptor {
  id: string;
  js: string;
  css?: string | null;
}

interface FrontendPluginRegistration {
  id: string;
  activate(ctx: PluginContext): void | Promise<void>;
}

const pluginReactDOM = {
  ...ReactDOM,
  ...ReactDOMClient,
};

interface PluginContext {
  React: typeof React;
  ReactDOM: typeof pluginReactDOM;
  registerInputRenderer: typeof registerInputRenderer;
  registerOutputRenderer: typeof registerOutputRenderer;
  registerLargeDataSerializer: typeof registerLargeDataSerializer;
  toast: typeof toast;
  components: {
    ResizableHeight: typeof ResizableHeight;
    ResizableHeightHandle: typeof ResizableHeightHandle;
    SyncedWidthHandle: typeof SyncedWidthHandle;
    Dialog: typeof Dialog;
    DialogContent: typeof DialogContent;
    DialogDescription: typeof DialogDescription;
    DialogFooter: typeof DialogFooter;
    DialogHeader: typeof DialogHeader;
    DialogTitle: typeof DialogTitle;
    Button: typeof Button;
  };
}

interface PythonNodeEditorGlobal {
  React: typeof React;
  ReactDOM: typeof pluginReactDOM;
  registerPlugin(plugin: FrontendPluginRegistration): void;
  activatePlugin(id: string): Promise<void>;
}

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof pluginReactDOM;
    PythonNodeEditor: PythonNodeEditorGlobal;
  }
}

function getActivePluginMetadata() {
  if (!activePluginId) {
    return {};
  }

  const descriptor = pluginDescriptors.get(activePluginId);
  return {
    pluginId: activePluginId,
    pluginCssHref: descriptor?.css ?? null,
  };
}

const pluginContext: PluginContext = {
  React,
  ReactDOM: pluginReactDOM,
  registerInputRenderer(typeName, entry) {
    registerInputRenderer(typeName, {
      ...entry,
      ...getActivePluginMetadata(),
    });
  },
  registerOutputRenderer(typeName, entry) {
    registerOutputRenderer(typeName, {
      ...entry,
      ...getActivePluginMetadata(),
    });
  },
  registerLargeDataSerializer,
  toast,
  components: {
    ResizableHeight,
    ResizableHeightHandle,
    SyncedWidthHandle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
  },
};

const registeredPlugins = new Map<string, FrontendPluginRegistration>();
const activatedPluginIds = new Set<string>();
const scriptLoadPromises = new Map<string, Promise<void>>();
const pluginDescriptors = new Map<string, FrontendPluginDescriptor>();
let activePluginId: string | null = null;

export function setupPluginRuntime(): void {
  window.React = React;
  window.ReactDOM = pluginReactDOM;

  window.PythonNodeEditor = {
    React,
    ReactDOM: pluginReactDOM,
    registerPlugin(plugin) {
      registeredPlugins.set(plugin.id, plugin);
    },
    async activatePlugin(id) {
      if (activatedPluginIds.has(id)) {
        return;
      }

      const plugin = registeredPlugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} did not register itself`);
      }

      activePluginId = id;
      try {
        await plugin.activate(pluginContext);
        activatedPluginIds.add(id);
      } finally {
        activePluginId = null;
      }
    },
  };
}

function loadPluginScript(plugin: FrontendPluginDescriptor): Promise<void> {
  const existingPromise = scriptLoadPromises.get(plugin.id);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = plugin.js;
    script.async = true;
    script.dataset.pnePluginId = plugin.id;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load frontend plugin ${plugin.id}`));
    document.head.appendChild(script);
  });

  scriptLoadPromises.set(plugin.id, promise);
  return promise;
}

export async function loadFrontendPlugin(
  plugin: FrontendPluginDescriptor,
): Promise<void> {
  setupPluginRuntime();
  pluginDescriptors.set(plugin.id, plugin);
  await loadPluginScript(plugin);
  await window.PythonNodeEditor.activatePlugin(plugin.id);
}

export async function loadFrontendPlugins(
  plugins: FrontendPluginDescriptor[] = [],
): Promise<void> {
  setupPluginRuntime();
  for (const plugin of plugins) {
    await loadFrontendPlugin(plugin);
  }
}
