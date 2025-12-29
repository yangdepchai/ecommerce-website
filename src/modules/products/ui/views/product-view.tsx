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

const CartButton = dynamic(
    () => import("../components/cart-button").then(
        (mod)=>mod.CartButton,
    ),
    {
        ssr:false,
        loading: () => <Button disabled className="flex-1 bg-white text-black">Thêm vào giỏ hàng</Button>
    },
);

interface ProductViewProps {
    productId: string;
    tenantSlug: string;
};

export const ProductView = ({ productId, tenantSlug }: ProductViewProps) => {
    const trpc = useTRPC();
    
    // 1. Lấy thông tin sản phẩm
    const { data } = useSuspenseQuery(
        trpc.products.getOne.queryOptions({ id: productId }),
    );

    // 2. Kiểm tra quyền sở hữu
    const { data: ownership, isLoading: isCheckingOwnership } = useQuery(
        trpc.products.checkOwnership.queryOptions({ productId })
    );
    
    const isOwned = ownership?.isOwned;

    // 3. Logic check hết hàng
    const isOutOfStock = (data.isInfiniteStock === false) && (data.stock ?? 0) <= 0;

    return (
        <div className="px-4 lg:px-12 py-10">
            <div className="border rounded-sm bg-white overflow-hidden">
                <div className="relative aspect-[3.9] border-b">
                    <Image
                        src={data.image?.url||"/null.png"}
                        alt={data.name}
                        fill
                        className="object-cover"
                    />
                    {/* Badge trên ảnh lớn nếu hết hàng */}
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
                                   { data.tenant.image?.url && (
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
                                   <StarRating
                                     rating={3}
                                     iconClassName="size-4"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="block lg:hidden px-6 py-4 items-center justify-center border-b">
                            <div className="flex items-center gap-1">
                               <StarRating
                                 rating={3}
                                 iconClassName="size-4"
                                />
                                <p className="text-base font-medium">
                                   {5} đánh giá
                                </p>
                            </div>
                        </div>
                        <div className="p-6">
                            {data.description ?(
                                <p>{data.description}</p>
                            ) : (
                                <p className="font-medium text-muted-foreground italic">Không có mô tả cho sản phẩm này.</p>
                            )}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="border-t lg:border-t-0 lg:border-l h-full">
                            <div className="flex flex-col p-6 gap-4 border-b">
                                
                                {/* --- KHU VỰC NÚT MUA --- */}
                                
                                {/* TH1: Đang tải check sở hữu -> Hiện loading nhẹ để tránh nhảy layout */}
                                {isCheckingOwnership ? (
                                     <Button disabled className="w-full bg-gray-100 text-gray-400">
                                        Đang kiểm tra...
                                     </Button>
                                ) : isOwned ? (
                                    // TH2: ĐÃ MUA -> Hiện nút truy cập
                                    <div className="flex flex-col gap-3 w-full animate-in fade-in">
                                        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                                            <CheckCircle size={20} />
                                            <span className="font-bold">Bạn đã sở hữu</span>
                                        </div>
                                        <Link href="/my-orders" className="w-full">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg shadow-md transition-all">
                                                Truy cập nội dung
                                            </Button>
                                        </Link>
                                    </div>
                                ) : isOutOfStock ? (
                                    // TH3: CHƯA MUA NHƯNG HẾT HÀNG -> Nút xám Disable
                                    <div className="flex flex-col gap-2 w-full">
                                        <Button disabled className="w-full bg-gray-200 text-gray-500 h-12 text-lg font-bold border border-gray-300">
                                            Sản phẩm đã hết hàng
                                        </Button>
                                        <p className="text-xs text-center text-gray-400">Vui lòng quay lại sau</p>
                                    </div>
                                ) : (
                                    // TH4: CHƯA MUA VÀ CÒN HÀNG -> Nút mua bình thường
                                    <div className="flex flex-row items-center gap-2">
                                        <CartButton
                                            productId={productId}
                                            tenantSlug={tenantSlug}
                                        />
                                        <Button
                                            className="size-12"
                                            variant="elevated"
                                            onClick={() => {}}
                                            disabled={false}
                                        >
                                            <LinkIcon/>
                                        </Button>
                                    </div>
                                )}
                                {/* ------------------------ */}
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-medium">Đánh giá</h3>
                                    <div className="flex items-center gap-x-1 font-medium">
                                        <StarIcon className="size-4 fill-black"/>
                                        <p>({5})</p>
                                        <p className="text-base">{5} đánh giá</p>
                                    </div>
                                </div>
                                <div
                                    className="grid grid-cols-[auto_1fr_auto] gap-3 mt-4"
                                >
                                    {[5,4,3,2,1].map((stars) => (
                                        <Fragment key={stars}>
                                            <div className="font-medium">{stars} {stars === 1? "sao" : "sao"}</div>
                                            <Progress
                                                value={0}
                                                className="h-[1lh]"
                                            />
                                            <div className="font-medium">
                                                {0}%
                                            </div>
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
//TODO: thêm chức năng đánh giá sau