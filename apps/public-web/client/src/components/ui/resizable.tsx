import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

// react-resizable-panels v4 renamed the primitives: PanelGroup -> Group,
// PanelResizeHandle -> Separator, and `direction` became `orientation`.
// The wrapper keeps the old call sites (`<ResizablePanelGroup direction=…>`)
// by translating both the prop and the data attribute the handle styles read.
function ResizablePanelGroup({
  className,
  orientation,
  direction,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group> & {
  direction?: "horizontal" | "vertical";
}) {
  const resolved = orientation ?? direction ?? "horizontal";
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      orientation={resolved}
      className={cn(
        "group/resizable flex h-full w-full",
        resolved === "vertical" && "flex-col",
        className
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden group-data-[orientation=vertical]/resizable:h-px group-data-[orientation=vertical]/resizable:w-full group-data-[orientation=vertical]/resizable:after:left-0 group-data-[orientation=vertical]/resizable:after:h-1 group-data-[orientation=vertical]/resizable:after:w-full group-data-[orientation=vertical]/resizable:after:translate-x-0 group-data-[orientation=vertical]/resizable:after:-translate-y-1/2 group-data-[orientation=vertical]/resizable:[&>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
