"use client";

import Link from "next/link";
import Image from "next/image";
import { StarIcon, CheckCircle } from "lucide-react";
import { formatPrice, generateTenantUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface ProductCardProps {
    id: string;
    name: string;
    imageUrl?: string | null;
    tenantSlug: string;
    tenantImageUrl?: string | null;
    reviewRating: number; // Điểm trung bình
    reviewCount: number;  // Số lượng đánh giá
    price: number;
    isInfiniteStock: boolean;
    stock: number;
};

export const ProductCard = ({
    id,
    name,
    imageUrl,
    tenantSlug,
    tenantImageUrl,
    reviewRating,
    reviewCount,
    price,
    isInfiniteStock,
    stock,
}: ProductCardProps) => {
    const router = useRouter();
    const trpc = useTRPC();
    
    // Logic check hết hàng
    const isOutOfStock = (isInfiniteStock === false) && (stock ?? 0) <= 0;

    // API check sở hữu
    const { data: ownership } = useQuery(
        trpc.products.checkOwnership.queryOptions({ productId: id })
    );

    const isOwned = ownership?.isOwned;

    const handleUserClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(generateTenantUrl(tenantSlug));
    }

    const formattedPrice = formatPrice(price);
    const productHref = `${generateTenantUrl(tenantSlug)}/products/${id}`;

    // --- XỬ LÝ ĐIỂM ĐÁNH GIÁ ---
    // Format về 1 chữ số thập phân (ví dụ: 4.5)
    const displayRating = reviewRating ? Number(reviewRating).toFixed(1) : "0.0";

    return (
        <Link href={productHref}>
            <div className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border rounded-md bg-white overflow-hidden h-full flex flex-col group relative">

                {/* Phần Ảnh */}
                <div className="relative aspect-square">
                    <Image
                        alt={name}
                        fill
                        src={imageUrl || "/null.png"}
                        className="object-cover"
                    />

                    {/* Badge: Đã sở hữu */}
                    {isOwned && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                            <CheckCircle size={12} /> Đã sở hữu
                        </div>
                    )}

                    {/* Badge: Hết hàng */}
                    {!isOwned && isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                             <span className="border-2 border-white text-white px-3 py-1 font-bold rounded uppercase tracking-wider">
                                Hết hàng
                             </span>
                        </div>
                    )}
                </div>

                {/* Phần Nội dung */}
                <div className="p-4 border-y flex flex-col gap-3 flex-1">
                    <h2 className="text-lg font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {name}
                    </h2>

                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 w-fit" onClick={handleUserClick}>
                        {tenantImageUrl && (
                            <Image
                                alt={tenantSlug}
                                src={tenantImageUrl}
                                width={16}
                                height={16}
                                className="rounded-full border shrink-0 size-[16px]"
                            />
                        )}
                        <p className="text-sm underline font-medium text-gray-500">{tenantSlug}</p>
                    </div>

                    {/* --- HIỂN THỊ ĐÁNH GIÁ (Đã tối ưu) --- */}
                    {reviewCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 bg-yellow-100/50 px-1.5 py-0.5 rounded">
                                <StarIcon className="size-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs font-bold text-yellow-700 pt-[1px]">
                                    {displayRating}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium pt-[1px]">
                                ({reviewCount} đánh giá)
                            </p>
                        </div>
                    )}
                    {/* ------------------------------------- */}
                </div>

                {/* Phần Giá tiền / Trạng thái */}
                <div className="p-4">
                    {isOwned ? (
                        <div className="px-3 py-1.5 border border-green-200 bg-green-50 w-fit rounded-md">
                            <p className="text-sm font-bold text-green-700">Xem ngay</p>
                        </div>
                    ) : isOutOfStock ? (
                        <div className="px-3 py-1.5 bg-gray-100 w-fit rounded-md">
                             <p className="text-sm font-medium text-gray-500">Đã bán hết</p>
                        </div>
                    ) : (
                        <div className="relative px-2 py-1 border bg-white w-fit group-hover:bg-gray-50 transition-colors">
                            <p className="text-sm font-medium">{formattedPrice}đ</p>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
};

export const ProductCardSkeleton = () => {
    return (
        <div className="w-full aspect-[3/4] bg-neutral-200 rounded-lg animate-pulse" />
    );
};