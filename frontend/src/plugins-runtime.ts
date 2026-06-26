import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  registerInputRenderer as registerInputRendererBase,
  registerLargeDataSerializer,
  registerOutputRenderer as registerOutputRendererBase,
} from "./plugin-api";
import type { ComponentType } from "react";
import type { TypeSchema } from "./types/backend-schema";
import type { LargeDataSerializer } from "./utils/large-data-serializer-registry";

export interface FrontendPluginDescriptor {
  id: string;
  js: string;
  css?: string;
}

export interface PluginControlledInputProps {
  value: unknown;
  onChange: (value: unknown, debounce?: number) => Promise<void> | void;
  disabled: boolean;
  expanded?: boolean;
  setValid?: (valid: boolean) => void;
  typeSchema?: TypeSchema;
}

export interface PluginControlledOutputProps {
  value: unknown;
  expanded?: boolean;
  typeSchema?: TypeSchema;
}

export interface FrontendPluginContext {
  React: typeof React;
  registerInputRenderer: (
    typeName: string,
    entry: {
      component: ComponentType<PluginControlledInputProps>;
      expandedComponent?: ComponentType<PluginControlledInputProps>;
      expandable: boolean;
    },
  ) => void;
  registerOutputRenderer: (
    typeName: string,
    entry: {
      component: ComponentType<PluginControlledOutputProps>;
      expandedComponent?: ComponentType<PluginControlledOutputProps>;
      expandable: boolean;
      defaultExpandedHeight?: number;
    },
  ) => void;
  registerLargeDataSerializer: (
    typeName: string,
    serializer: LargeDataSerializer,
  ) => void;
}

export interface FrontendPlugin {
  id: string;
  activate: (context: FrontendPluginContext) => void | Promise<void>;
}

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
    PythonNodeEditor: {
      React: typeof React;
      ReactDOM: typeof ReactDOM;
      registerPlugin: (plugin: FrontendPlugin) => void;
      activatePlugin: (id: string) => Promise<void>;
    };
  }
}

const plugins = new Map<string, FrontendPlugin>();
const activatedPluginIds = new Set<string>();

const pluginContext: FrontendPluginContext = {
  React,
  registerInputRenderer(typeName, entry) {
    registerInputRendererBase(typeName, { ...entry, hostResizable: true });
  },
  registerOutputRenderer(typeName, entry) {
    registerOutputRendererBase(typeName, { ...entry, hostResizable: true });
  },
  registerLargeDataSerializer,
};

export function initFrontendPluginHost() {
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.PythonNodeEditor = {
    React,
    ReactDOM,
    registerPlugin(plugin: FrontendPlugin) {
      plugins.set(plugin.id, plugin);
    },
    async activatePlugin(id: string) {
      if (activatedPluginIds.has(id)) {
        return;
      }

      const plugin = plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} did not register itself`);
      }

      await plugin.activate(pluginContext);
      activatedPluginIds.add(id);
    },
  };
}

async function loadFrontendPlugin(plugin: FrontendPluginDescriptor) {
  if (activatedPluginIds.has(plugin.id)) {
    return;
  }

  if (plugin.css && !document.querySelector(`link[data-pne-plugin="${plugin.id}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = plugin.css;
    link.dataset.pnePlugin = plugin.id;
    document.head.appendChild(link);
  }

  if (!document.querySelector(`script[data-pne-plugin="${plugin.id}"]`)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = plugin.js;
      script.dataset.pnePlugin = plugin.id;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${plugin.js}`));
      document.head.appendChild(script);
    });
  }

  await window.PythonNodeEditor.activatePlugin(plugin.id);
}

export async function loadFrontendPlugins(plugins: FrontendPluginDescriptor[] = []) {
  for (const plugin of plugins) {
    await loadFrontendPlugin(plugin);
  }
}
