import React from "react";

interface ColProps {
    children: React.ReactNode;
    colSpan?: number | string;
    className?: string;
    style?: React.CSSProperties;
}

export const FluidCol: React.FC<ColProps> = ({
                                                 children,
                                                 colSpan = 12,
                                                 className = "",
                                                 style,
                                             }) => {
    let colClass = "";

    if (typeof colSpan === "number") {
        colClass = `col-span-${colSpan}`;
    } else if (typeof colSpan === "string") {
        colClass = colSpan;
    }

    return (
        <div
            className={[colClass, className].filter(Boolean).join(" ")}
            style={style}
        >
            {children}
        </div>
    );
};
