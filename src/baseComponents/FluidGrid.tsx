// src/components/layout/FluidGrid.tsx
import React from "react";

const maxWidthClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    "screen-sm": "max-w-screen-sm",
    "screen-md": "max-w-screen-md",
    "screen-lg": "max-w-screen-lg",
    "screen-xl": "max-w-screen-xl",
    "screen-2xl": "max-w-screen-2xl",
} as const;

interface FluidGridProps {
    children: React.ReactNode;
    maxW?: keyof typeof maxWidthClasses;
    gap?: string;
    center?: boolean;
    slim?: boolean;
    className?: string;
}

export const FluidGrid: React.FC<FluidGridProps> = ({
                                                        children,
                                                        maxW = "full",
                                                        gap = "gap-4",
                                                        center = false,
                                                        slim = true,
                                                        className = "",
                                                    }) => {
    return (
        <div
            className={`
        w-full 
        ${center ? "mx-auto" : ""}
        ${slim ? "px-2" : "px-4 sm:px-6 lg:px-8"}
        ${maxWidthClasses[maxW]}
      `}
        >
            <div className={`grid grid-cols-12 ${gap} ${className}`}>
                {children}
            </div>
        </div>
    );
};
