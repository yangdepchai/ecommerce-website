"use client";

import { StarRating } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatPrice, generateTenantUrl } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { LinkIcon, StarIcon, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Fragment } from 'react';

// 1. IMPORT COMPONENT REVIEW MỚI
import { ReviewSection } from '@/modules/reviews/ui/components/review-section';

const CartButton = dynamic(
    () => import("../components/cart-button").then(
        (mod) => mod.CartButton,
    ),
    {
        ssr: false,
        loading: () => <Button disabled className="flex-1 bg-white text-black">Thêm vào giỏ hàng</Button>
    },
);

interface ProductViewProps {
    productId: string;
    tenantSlug: string;
};

export const ProductView = ({ productId, tenantSlug }: ProductViewProps) => {
    const trpc = useTRPC();

    // Lấy thông tin sản phẩm
    const { data } = useSuspenseQuery(
        trpc.products.getOne.queryOptions({ id: productId }),
    );

    // Kiểm tra quyền sở hữu
    const { data: ownership, isLoading: isCheckingOwnership } = useQuery(
        trpc.products.checkOwnership.queryOptions({ productId })
    );

    const isOwned = ownership?.isOwned;
    const isOutOfStock = (data.isInfiniteStock === false) && (data.stock ?? 0) <= 0;

    // Lấy dữ liệu đánh giá thực tế (Mặc định là 0 nếu chưa có)
    const ratingValue = data.rating || 0;
    const ratingCount = data.reviewCount || 0;
    const starCounts = data.starCounts as Record<string, number> || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const totalReviews = data.reviewCount || 0;
    return (
        <div className="px-4 lg:px-12 py-10">
            <div className="border rounded-sm bg-white overflow-hidden">
                <div className="relative aspect-[3.9] border-b">
                    <Image
                        src={data.image?.url || "/null.png"}
                        alt={data.name}
                        fill
                        className="object-cover"
                    />
                    {!isOwned && isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-3xl font-bold border-4 border-white px-8 py-2 rounded uppercase tracking-widest">
                                HẾT HÀNG
                            </span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-6">
                    <div className="col-span-4">
                        <div className="p-6">
                            <h1 className="text-4xl font-medium">{data.name}</h1>
                        </div>
                        <div className="border-y flex">
                            <div className="px-6 py-4 flex items-center justify-center border-r">
                                <div className="relative px-2 py-1 border bg-white w-fit">
                                    <p className="text-2xl font-medium">{formatPrice(data.price)}đ</p>
                                </div>
                            </div>
                            <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                                <Link href={generateTenantUrl(tenantSlug)} className="flex items-center gap-2">
                                    {data.tenant.image?.url && (
                                        <Image
                                            alt={data.tenant.name}
                                            src={data.tenant.image.url}
                                            width={24}
                                            height={24}
                                            className="rounded-full border shrink-0 size-[24px]"
                                        />
                                    )}
                                    <p className="text-base underline font-medium">{data.tenant.name}</p>
                                </Link>
                            </div>
                            <div className="hidden lg:flex px-6 py-4 flex items-center justify-center">
                                <div className="flex items-center gap-1">
                                    {/* SỬA: Dùng rating thật */}
                                    <StarRating
                                        rating={ratingValue}
                                        iconClassName="size-4"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Rating View */}
                        <div className="block lg:hidden px-6 py-4 items-center justify-center border-b">
                            <div className="flex items-center gap-1">
                                <StarRating
                                    rating={ratingValue}
                                    iconClassName="size-4"
                                />
                                <p className="text-base font-medium">
                                    {ratingCount} đánh giá
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            {data.description ? (
                                <p>{data.description}</p>
                            ) : (
                                <p className="font-medium text-muted-foreground italic">Không có mô tả cho sản phẩm này.</p>
                            )}

                            {/* 2. CHÈN COMPONENT REVIEW VÀO ĐÂY */}
                            <ReviewSection productId={productId} />
                            {/* -------------------------------- */}
                        </div>
                    </div>

                    {/* Sidebar bên phải */}
                    <div className="col-span-2">
                        <div className="border-t lg:border-t-0 lg:border-l h-full">
                            <div className="flex flex-col p-6 gap-4 border-b">
                                {/* ... (Logic nút mua hàng giữ nguyên) ... */}
                                {isCheckingOwnership ? (
                                    <Button disabled className="w-full bg-gray-100 text-gray-400">Đang kiểm tra...</Button>
                                ) : isOwned ? (
                                    <div className="flex flex-col gap-3 w-full animate-in fade-in">
                                        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                                            <CheckCircle size={20} />
                                            <span className="font-bold">Bạn đã sở hữu</span>
                                        </div>
                                        <Link href="/my-orders" className="w-full">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg">Truy cập nội dung</Button>
                                        </Link>
                                    </div>
                                ) : isOutOfStock ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <Button disabled className="w-full bg-gray-200 text-gray-500 h-12 text-lg font-bold border border-gray-300">Sản phẩm đã hết hàng</Button>
                                        <p className="text-xs text-center text-gray-400">Vui lòng quay lại sau</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-row items-center gap-2">
                                        <CartButton productId={productId} tenantSlug={tenantSlug} />
                                        <Button className="size-12" variant="elevated"><LinkIcon /></Button>
                                    </div>
                                )}
                            </div>

                            {/* Phần thống kê đánh giá (Sidebar) */}
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-medium">Đánh giá</h3>
                                    <div className="flex items-center gap-x-1 font-medium">
                                        <StarIcon className="size-4 fill-black" />
                                        <p>({ratingValue})</p>
                                        <p className="text-base">{ratingCount} đánh giá</p>
                                    </div>
                                </div>

                                {/* Lưu ý: Biểu đồ % (Histogram) bên dưới hiện tại đang để 0%.
                                    Để nó chạy thật, bạn cần viết thêm API Aggregation phức tạp.
                                    Tạm thời để 0% hoặc ẩn đi cũng được.
                                */}
                                <div className="grid grid-cols-[auto_1fr_auto] gap-3 mt-4">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        // 1. Lấy số lượng của sao hiện tại
                                        const count = starCounts[star] || 0;
                                        
                                        // 2. Tính phần trăm (Tránh chia cho 0)
                                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                                        return (
                                            <Fragment key={star}>
                                                <div className="font-medium text-sm text-gray-600 w-10">{star} sao</div>
                                                <Progress 
                                                    value={percentage} 
                                                    className="h-2 mt-1.5" // Chỉnh lại style thanh cho đẹp
                                                />
                                                <div className="font-medium text-sm text-gray-400 w-8 text-right">
                                                    {Math.round(percentage)}%
                                                </div>
                                            </Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}