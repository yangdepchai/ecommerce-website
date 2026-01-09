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
    // 1. Lấy toàn bộ filters (bao gồm cả 'q') từ URL thông qua nuqs
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
                // 2. Truyền filters vào API (đã bao gồm q, sort, price, tags...)
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

    // 3. Xử lý trường hợp không có dữ liệu
    if (data.pages?.[0]?.docs.length === 0) {
        return (
            <div className="border border-dashed border-gray-300 flex items-center justify-center p-16 flex-col gap-y-4 bg-white w-full rounded-lg text-gray-500">
                <InboxIcon className="size-10" />
                <p className="text-base font-medium">
                    {filters.q 
                        ? `Không tìm thấy sản phẩm nào cho từ khóa "${filters.q}"`
                        : "Không tìm thấy sản phẩm nào"
                    }
                </p>
            </div>
        )
    }

    return (
        <>
            <div className={cn(
                // 4. Grid Responsive chuẩn
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
                        
                        // 5. Dữ liệu đánh giá từ Database
                        reviewRating={product.rating || 0}
                        reviewCount={product.reviewCount || 0}

                        // 6. Logic tồn kho an toàn (Mặc định là vô hạn nếu null)
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
                        className="min-w-[120px]"
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
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
            narrowView && "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
        )}>
            {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    );
};