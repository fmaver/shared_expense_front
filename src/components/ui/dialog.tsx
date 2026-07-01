"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// Swipe-down-to-dismiss: directly mutate popup.style.transform so the DOM updates
// every frame without waiting for React's batched re-render cycle.
//
// Uses a callback ref (not useRef+useEffect) so listeners attach the instant the
// handle mounts — which only happens when the dialog is open. useEffect runs on
// *component* mount, at which point Base UI hasn't rendered the popup children yet
// (open=false), so dragHandleRef.current would be null and listeners would never attach.
function useDragToDismiss(threshold = 80) {
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const cleanupRef  = React.useRef<(() => void) | null>(null);

  const dragHandleRef = React.useCallback((handle: HTMLDivElement | null) => {
    // Always run previous cleanup first (handles StrictMode double-invoke + remounts)
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!handle) return;

    const popup = handle.closest('[data-slot="dialog-content"]') as HTMLElement | null;
    if (!popup) return;

    const pill = handle.querySelector('div') as HTMLElement | null;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      popup.style.transition = 'none';
      if (pill) {
        pill.style.transition = 'width 150ms ease-out, opacity 150ms ease-out';
        pill.style.width = '2.5rem';
        pill.style.opacity = '0.6';
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // preventDefault stops the parent overflow-y-auto from scrolling while dragging
      e.preventDefault();
      const delta = Math.max(0, e.touches[0].clientY - startY);
      popup.style.transform = `translateY(${delta}px)`;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const delta = Math.max(0, e.changedTouches[0].clientY - startY);
      if (pill) { pill.style.width = ''; pill.style.opacity = ''; }
      popup.style.transition = 'transform 350ms cubic-bezier(0.32, 0.72, 0, 1)';
      if (delta > threshold) {
        // Suppress CSS sheet-exit; our spring handles the visual exit.
        // @base-ui waits for transitionend (350ms) then unmounts.
        popup.dataset.dragDismiss = '';
        popup.style.transform = `translateY(${window.innerHeight}px)`;
        closeBtnRef.current?.click();
      } else {
        popup.style.transform = '';
      }
    };

    // passive:true on touchstart so the browser doesn't complain; touch-action:none
    // on the handle element (CSS) is what actually prevents iOS scroll-claim.
    // passive:false on touchmove so we can call preventDefault() mid-drag.
    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('touchmove',  onTouchMove,  { passive: false });
    handle.addEventListener('touchend',   onTouchEnd,   { passive: true });

    cleanupRef.current = () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove',  onTouchMove);
      handle.removeEventListener('touchend',   onTouchEnd);
    };
  }, [threshold]);

  return { closeBtnRef, dragHandleRef };
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
  const { closeBtnRef, dragHandleRef } = useDragToDismiss();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Base
          "fixed z-50 w-full bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none",
          // Mobile: bottom sheet (animation comes from index.css keyframes)
          "bottom-0 inset-x-0 rounded-t-2xl rounded-b-none max-h-[88vh] overflow-y-auto grid gap-4 px-4 pb-4 pt-0",
          // Desktop: centered dialog with tailwindcss-animate zoom
          "lg:bottom-auto lg:inset-x-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
          "lg:max-w-[calc(100%-2rem)] lg:sm:max-w-sm lg:rounded-xl lg:max-h-none lg:overflow-visible lg:p-4",
          "lg:duration-150 lg:[animation-timing-function:ease-out]",
          "lg:data-open:animate-in lg:data-open:fade-in-0 lg:data-open:zoom-in-95",
          "lg:data-closed:animate-out lg:data-closed:fade-out-0 lg:data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {/* Drag handle — mobile only; native listeners (passive:false) block parent scroll */}
        <div
          ref={dragHandleRef}
          className="lg:hidden -mx-4 flex justify-center items-center py-3 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 transition-[width,opacity] duration-150" />
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
