"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    required?: boolean;
    description?: string;
}

export function RatingInput({ label, value, onChange, required, description }: RatingInputProps) {
    const [hover, setHover] = useState(0);

    const ratingDescriptions = [
        "", // 0 stars
        "Poor",
        "Fair",
        "Good",
        "Very Good",
        "Excellent",
    ];

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>

            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => onChange(rating)}
                        onMouseEnter={() => setHover(rating)}
                        onMouseLeave={() => setHover(0)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                        aria-label={`${rating} stars`}
                    >
                        <Star
                            className={`h-8 w-8 transition-colors ${rating <= (hover || value)
                                    ? "fill-yellow-400 stroke-yellow-400"
                                    : "fill-transparent stroke-muted-foreground"
                                }`}
                        />
                    </button>
                ))}

                {(hover || value) > 0 && (
                    <span className="ml-3 text-sm font-medium text-muted-foreground">
                        {ratingDescriptions[hover || value]}
                    </span>
                )}
            </div>

            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
