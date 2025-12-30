"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useProductFilters } from "../../hooks/use-product-filters";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";
import { InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    category?: string;
    tenantSlug?: string;
    narrowView?: boolean;
}

export const ProductList = ({ category, tenantSlug, narrowView }: Props) => {
    const [filters] = useProductFilters();
    const trpc = useTRPC();
    
    const {
        data,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage
    } = useSuspenseInfiniteQuery(
        trpc.products.getMany.infiniteQueryOptions(
            {
                ...filters,
                category,
                tenantSlug,
                limit: DEFAULT_LIMIT,
            },
            {
                getNextPageParam: (lastPage) => {
                    return lastPage.docs.length > 0 ? lastPage.nextPage : undefined;
                },
            }
        )
    );

    if (data.pages?.[0]?.docs.length === 0) {
        return (
            <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
                <InboxIcon />
                <p className="text-base font-medium">Không tìm thấy sản phẩm</p>
            </div>
        )
    }

    return (
        <>
            <div className={cn(
                // Sửa lỗi chính tả: 'gird-cols-1' -> 'grid-cols-1'
                "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
                narrowView && "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
            )}>
                {data?.pages.flatMap((page) => page.docs).map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        imageUrl={product.image?.url}
                        tenantSlug={product.tenant.slug}
                        tenantImageUrl={product.tenant.image?.url}
                        price={product.price}
                        
                        // 1. Cập nhật dữ liệu đánh giá thật (Database)
                        reviewRating={product.rating || 0}
                        reviewCount={product.reviewCount || 0}

                        // 2. Cập nhật dữ liệu tồn kho
                        isInfiniteStock={product.isInfiniteStock ?? true}
                        stock={product.stock ?? 0}
                    />
                ))}
            </div>
            <div className="flex justify-center pt-8">
                {hasNextPage && (
                    <Button
                        disabled={isFetchingNextPage}
                        onClick={() => fetchNextPage()}
                        variant="elevated"
                    >
                        {isFetchingNextPage ? "Đang tải..." : "Hiện thêm..."}
                    </Button>
                )}
            </div>
        </>
    );
};

export const ProductListSkeleton = ({ narrowView }: Props) => {
    return (
        <div className={cn(
            // Sửa lỗi chính tả tương tự ở Skeleton
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
            narrowView && "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
        )}>
            {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    );
};