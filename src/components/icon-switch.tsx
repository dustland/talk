"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface IconSwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  CheckedIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

const sizeClasses = {
  sm: {
    root: "h-5 w-10",
    thumb: "h-4 w-4",
    translate: "translate-x-[24px]",
    icon: "h-3 w-3",
  },
  md: {
    root: "h-7 w-14",
    thumb: "h-6 w-6",
    translate: "translate-x-[28px]",
    icon: "h-4 w-4",
  },
  lg: {
    root: "h-9 w-18",
    thumb: "h-8 w-8",
    translate: "translate-x-[40px]",
    icon: "h-6 w-6",
  },
};

const IconSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  IconSwitchProps
>(
  (
    {
      className,
      Icon,
      CheckedIcon,
      checked,
      onCheckedChange,
      size = "md",
      tooltip,
      ...props
    },
    ref
  ) => {
    const classes = sizeClasses[size];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SwitchPrimitives.Root
              className={cn(
                `peer inline-flex ${classes.root} shrink-0 cursor-pointer items-center rounded-full transition-colors`,
                "border-2 border-transparent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-primary" : "bg-input",
                className
              )}
              checked={checked}
              onCheckedChange={onCheckedChange}
              {...props}
              ref={ref}
            >
              <SwitchPrimitives.Thumb
                className={cn(
                  `pointer-events-none relative flex items-center justify-center ${classes.thumb} rounded-full bg-background`,
                  "shadow-lg ring-0 transition-transform",
                  checked ? classes.translate : "translate-x-0"
                )}
              >
                {checked ? (
                  <CheckedIcon className={`${classes.icon} text-primary`} />
                ) : (
                  <Icon className={`${classes.icon} text-primary`} />
                )}
              </SwitchPrimitives.Thumb>
            </SwitchPrimitives.Root>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
IconSwitch.displayName = "IconSwitch";

export { IconSwitch };
