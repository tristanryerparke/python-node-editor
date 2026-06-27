import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "./common/utility-components/resizable-height";
import { SyncedWidthHandle } from "./common/utility-components/synced-width-resizable";
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

interface PluginContext {
  React: typeof React;
  ReactDOM: typeof ReactDOMClient;
  registerInputRenderer: typeof registerInputRenderer;
  registerOutputRenderer: typeof registerOutputRenderer;
  registerLargeDataSerializer: typeof registerLargeDataSerializer;
  components: {
    ResizableHeight: typeof ResizableHeight;
    ResizableHeightHandle: typeof ResizableHeightHandle;
    SyncedWidthHandle: typeof SyncedWidthHandle;
  };
}

interface PythonNodeEditorGlobal {
  React: typeof React;
  ReactDOM: typeof ReactDOMClient;
  registerPlugin(plugin: FrontendPluginRegistration): void;
  activatePlugin(id: string): Promise<void>;
}

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOMClient;
    PythonNodeEditor: PythonNodeEditorGlobal;
  }
}

const pluginContext: PluginContext = {
  React,
  ReactDOM: ReactDOMClient,
  registerInputRenderer,
  registerOutputRenderer,
  registerLargeDataSerializer,
  components: {
    ResizableHeight,
    ResizableHeightHandle,
    SyncedWidthHandle,
  },
};

const registeredPlugins = new Map<string, FrontendPluginRegistration>();
const activatedPluginIds = new Set<string>();
const scriptLoadPromises = new Map<string, Promise<void>>();
const loadedCssHrefs = new Set<string>();

export function setupPluginRuntime(): void {
  window.React = React;
  window.ReactDOM = ReactDOMClient;

  window.PythonNodeEditor = {
    React,
    ReactDOM: ReactDOMClient,
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

      await plugin.activate(pluginContext);
      activatedPluginIds.add(id);
    },
  };
}

function loadPluginCss(plugin: FrontendPluginDescriptor): void {
  if (!plugin.css || loadedCssHrefs.has(plugin.css)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = plugin.css;
  link.dataset.pnePluginId = plugin.id;
  document.head.appendChild(link);
  loadedCssHrefs.add(plugin.css);
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
  loadPluginCss(plugin);
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
