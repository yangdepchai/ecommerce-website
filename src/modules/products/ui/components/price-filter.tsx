"use client";

import { ChangeEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface Props {
    minPrice?: string | null;
    maxPrice?: string | null;
    onMinPriceChange: (value: string) => void;
    onMaxPriceChange: (value: string) => void;
};

export const formatAsCurrency = (value:string) => {
    const numericValue = value.replace(/[^0-9.]/g,"");
    const parts = numericValue.split(".");
    const formattedValue = parts[0] + (parts.length > 1 ? "." + parts[1]?.slice(0,2):"");
    if(!formattedValue) return "";
    const numberValue = parseFloat(formattedValue);
    if(isNaN(numberValue)) return "";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numberValue);
};

export const PriceFilter = ({
    minPrice,
    maxPrice,
    onMinPriceChange,
    onMaxPriceChange,
}: Props) => {
    const [isMinFocus, setIsMinFocus] = useState(false);
    const [isMaxFocus, setIsMaxFocus] = useState(false);
    const handleMinPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const numericValue = e.target.value.replace(/[^0-9]/g,"");
        onMinPriceChange(numericValue);
    }
    const handleMaxPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const numericValue = e.target.value.replace(/[^0-9]/g,"");
        onMaxPriceChange(numericValue);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
                <Label className="font-medium text-base">
                    Giá thấp nhất
                </Label>
                <Input
                    type="text"
                    value={isMinFocus 
                        ? (minPrice || "")
                        : (minPrice ? formatAsCurrency(minPrice) : "")
                    }
                    
                    onChange={handleMinPriceChange}
                    
                
                    onFocus={() => setIsMinFocus(true)}
                    onBlur={() => setIsMinFocus(false)}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label className="font-medium text-base">
                    Giá cao nhất
                </Label>
                <Input
                    type="text"
                    value={isMaxFocus
                        ? (maxPrice || "")
                        : (maxPrice ? formatAsCurrency(maxPrice) : "")
                    }
                    
                    onChange={handleMaxPriceChange}
                    onFocus={() => setIsMaxFocus(true)}
                    onBlur={() => setIsMaxFocus(false)}
                />
            </div>
        </div>
    )
};