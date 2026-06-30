"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// Swipe-down-to-dismiss: tracks touch on drag handle, clicks a hidden close button when threshold met
function useDragToDismiss(threshold = 100) {
  const startYRef = React.useRef(0);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = React.useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > threshold) {
      closeBtnRef.current?.click();
    }
  }, [threshold]);

  return { closeBtnRef, onTouchStart, onTouchEnd };
}

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-sm duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const { closeBtnRef, onTouchStart, onTouchEnd } = useDragToDismiss();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Base
          "fixed z-50 w-full bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none",
          // Mobile: bottom sheet
          "bottom-0 inset-x-0 rounded-t-2xl rounded-b-none max-h-[88vh] overflow-y-auto grid gap-4 px-4 pb-4 pt-0",
          // Mobile animation: gentle slide up with iOS spring easing
          "max-lg:duration-[450ms] max-lg:[animation-timing-function:cubic-bezier(0.32,0.72,0,1)]",
          "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          "max-lg:data-open:slide-in-from-bottom max-lg:data-closed:slide-out-to-bottom",
          // Desktop: centered dialog
          "lg:bottom-auto lg:inset-x-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
          "lg:max-w-[calc(100%-2rem)] lg:sm:max-w-sm lg:rounded-xl lg:max-h-none lg:overflow-visible lg:p-4",
          // Desktop animation: snappy zoom (desktop doesn't need the slow spring)
          "lg:duration-150 lg:[animation-timing-function:ease-out] lg:data-open:zoom-in-95 lg:data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {/* Drag handle — mobile only, touch target for swipe-to-dismiss */}
        <div
          className="lg:hidden -mx-4 flex justify-center items-center py-3 touch-pan-y cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Hidden close button used by swipe-to-dismiss */}
        <DialogPrimitive.Close
          render={<button ref={closeBtnRef} className="sr-only absolute" tabIndex={-1} aria-hidden />}
        />

        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        // On mobile: stick to the bottom of the sheet as the form scrolls
        "max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:bg-popover",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
