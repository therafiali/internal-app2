"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Play } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-black border border-gray-800 text-white shadow-2xl p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 text-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 disabled:pointer-events-none transition-opacity">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "text-center pb-6 border-b border-gray-800",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex gap-3 pt-4 border-t border-gray-800",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogProcessButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    userType?: string | null
    processEnabled?: boolean | null
    onProcess?: () => void
    processing?: boolean
  }
>(({ className, userType, processEnabled, onProcess, processing = false, ...props }, ref) => {
  // Only show process button if userType is "process" and processEnabled is true
  if (userType !== "process" || !processEnabled) {
    return null
  }

  return (
    <Button
      ref={ref}
      className={cn(
        "bg-green-600 hover:bg-green-700 text-white flex items-center gap-2",
        className
      )}
      onClick={onProcess}
      disabled={processing}
      {...props}
    >
      <Play className="h-4 w-4" />
      {processing ? "Processing..." : "Process"}
    </Button>
  )
})
DialogProcessButton.displayName = "DialogProcessButton"

const DialogProcessInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    userType?: string | null
    processEnabled?: boolean | null
    onProcess?: () => void
    processing?: boolean
    placeholder?: string
  }
>(({ className, userType, processEnabled, onProcess, processing = false, placeholder = "Type 'process' to enable...", ...divProps }, ref) => {
  const [processInput, setProcessInput] = React.useState('');
  
  // Only show process input if userType is "process" and processEnabled is true
  if (userType !== "process" || !processEnabled) {
    return null;
  }

  const isProcessButtonActive = processInput.toLowerCase().trim() === "process";

  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-3 items-center",
        className
      )}
      {...divProps}
    >
      <input
        type="text"
        value={processInput}
        onChange={(e) => setProcessInput(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 bg-[#18181b] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Button
        className={cn(
          "flex items-center gap-2",
          isProcessButtonActive 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "bg-gray-600 text-gray-400 cursor-not-allowed"
        )}
        onClick={onProcess}
        disabled={processing || !isProcessButtonActive}
      >
        <Play className="h-4 w-4" />
        {processing ? "Processing..." : "Process"}
      </Button>
    </div>
  )
})
DialogProcessInput.displayName = "DialogProcessInput"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogProcessButton,
  DialogProcessInput,
}
