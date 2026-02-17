"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Loader2 } from "lucide-react";

export interface BulkAction {
    label: string;
    icon: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "ghost";
    /** For dropdown-type actions (e.g. status change) */
    options?: { label: string; value: string }[];
    /** Called when action is triggered. value is passed for dropdown actions. */
    onExecute: (selectedIds: string[], value?: string) => Promise<void>;
    /** If true, shows a confirm dialog before executing */
    requireConfirm?: boolean;
    confirmTitle?: string;
    confirmDescription?: string;
}

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    actions: BulkAction[];
    isProcessing?: boolean;
}

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    actions,
    isProcessing = false,
}: BulkActionBarProps) {
    const [confirmAction, setConfirmAction] = useState<{
        action: BulkAction;
        value?: string;
    } | null>(null);
    const [processing, setProcessing] = useState(false);

    if (selectedCount === 0) return null;

    const handleExecute = async (action: BulkAction, value?: string) => {
        if (action.requireConfirm) {
            setConfirmAction({ action, value });
            return;
        }
        await executeAction(action, value);
    };

    const executeAction = async (action: BulkAction, value?: string) => {
        setProcessing(true);
        try {
            // The parent passes selectedIds through the callback
            await action.onExecute([], value);
        } finally {
            setProcessing(false);
            setConfirmAction(null);
        }
    };

    const isLoading = isProcessing || processing;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 dark:shadow-black/50">
                    {/* Selected count */}
                    <div className="flex items-center gap-2 pr-3 border-r border-border/50">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                            {selectedCount}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            selected
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={onClearSelection}
                            disabled={isLoading}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {actions.map((action, index) => {
                            if (action.options) {
                                return (
                                    <select
                                        key={index}
                                        className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            handleExecute(action, val);
                                            e.target.value = "";
                                        }}
                                        defaultValue=""
                                        disabled={isLoading}
                                    >
                                        <option value="" disabled>
                                            {action.label}
                                        </option>
                                        {action.options.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                );
                            }

                            return (
                                <Button
                                    key={index}
                                    variant={action.variant || "outline"}
                                    size="sm"
                                    className="rounded-xl gap-1.5 whitespace-nowrap"
                                    onClick={() => handleExecute(action)}
                                    disabled={isLoading}
                                >
                                    {isLoading && confirmAction?.action === action ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        action.icon
                                    )}
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <AlertDialog
                open={!!confirmAction}
                onOpenChange={() => setConfirmAction(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction?.action.confirmTitle || "Are you sure?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.action.confirmDescription ||
                                `This action will affect ${selectedCount} item(s). This cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmAction) {
                                    executeAction(
                                        confirmAction.action,
                                        confirmAction.value
                                    );
                                }
                            }}
                            disabled={processing}
                            className={
                                confirmAction?.action.variant === "destructive"
                                    ? "bg-destructive hover:bg-destructive/90"
                                    : ""
                            }
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
