"use client";

import * as React from "react";
import type { TreeInstance, ItemInstance } from "@headless-tree/core";
import { cn } from "@/lib/utils";

interface TreeProps<T> extends React.HTMLAttributes<HTMLUListElement> {
    tree: TreeInstance<T>;
    indent?: number;
}

function Tree<T>({ tree, indent = 20, className, children, ...props }: TreeProps<T>) {
    return (
        <ul
            {...(tree as any).getContainerProps?.()}
            className={cn("select-none text-sm outline-none", className)}
            style={{ "--tree-indent": `${indent}px` } as React.CSSProperties}
            {...props}
        >
            {children}
        </ul>
    );
}

interface TreeItemProps<T> extends React.HTMLAttributes<HTMLLIElement> {
    item: ItemInstance<T>;
}

function TreeItem<T>({ item, children, className, ...props }: TreeItemProps<T>) {
    return (
        <li
            {...(item as any).getProps?.()}
            className={cn("relative list-none", className)}
            {...props}
        >
            {children}
        </li>
    );
}

interface TreeItemLabelProps extends React.HTMLAttributes<HTMLDivElement> { }

function TreeItemLabel({ children, className, ...props }: TreeItemLabelProps) {
    return (
        <div
            className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 hover:bg-gray-100 transition-colors",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export { Tree, TreeItem, TreeItemLabel };
