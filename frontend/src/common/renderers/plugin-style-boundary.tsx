import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PluginStyleBoundaryProps {
  pluginId: string;
  cssHref?: string | null;
  children: ReactNode;
}

function getThemeClass(): string {
  const root = document.documentElement;
  if (root.classList.contains("dark")) {
    return "dark";
  }
  if (root.classList.contains("light")) {
    return "light";
  }
  return "";
}

export default function PluginStyleBoundary({
  pluginId,
  cssHref,
  children,
}: PluginStyleBoundaryProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);
  const [themeClass, setThemeClass] = useState("");

  useEffect(() => {
    setThemeClass(getThemeClass());

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setThemeClass(getThemeClass());
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadowRoot.replaceChildren();

    if (cssHref) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssHref;
      link.dataset.pnePluginId = pluginId;
      shadowRoot.appendChild(link);
    }

    const nextMountNode = document.createElement("div");
    nextMountNode.dataset.pnePluginId = pluginId;
    shadowRoot.appendChild(nextMountNode);
    setMountNode(nextMountNode);

    return () => {
      setMountNode(null);
      shadowRoot.replaceChildren();
    };
  }, [cssHref, pluginId]);

  return (
    <div
      ref={hostRef}
      data-pne-plugin-host={pluginId}
      className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden"
    >
      {mountNode
        ? createPortal(
            <div
              className={`pne-plugin-root flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden ${themeClass}`.trim()}
            >
              {children}
            </div>,
            mountNode,
          )
        : null}
    </div>
  );
}
