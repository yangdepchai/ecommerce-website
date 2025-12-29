"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Hoặc đường dẫn button của bạn
import { useState } from "react";
// Import hook thêm vào giỏ hàng của bạn (ví dụ useCart)
// import { useCart } from "@/hooks/use-cart"; 

interface ProductActionsProps {
  productId: string;
  price: number;
  name: string;
  imageUrl?: string | null;
}

export const ProductActions = ({ productId, price, name, imageUrl }: ProductActionsProps) => {
  const trpc = useTRPC();
  
  // 1. Kiểm tra quyền sở hữu
  const { data: ownership, isLoading } = useQuery(
    trpc.products.checkOwnership.queryOptions({ productId })
  );

  // Giả lập hàm thêm giỏ hàng (Bạn thay bằng logic thật của bạn)
  const addToCart = () => {
    console.log("Thêm vào giỏ:", productId);
    // cart.addItem({ ... })
  };

  if (isLoading) {
    return <Button disabled><Loader2 className="w-4 h-4 animate-spin mr-2"/> Đang kiểm tra...</Button>;
  }

  // 2. Nếu ĐÃ MUA -> Hiện nút "Truy cập ngay"
  if (ownership?.isOwned) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
             <CheckCircle className="w-5 h-5" />
             <span className="font-medium">Bạn đã sở hữu sản phẩm này</span>
        </div>
        <Link href="/my-orders" className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                Truy cập nội dung ngay
            </Button>
        </Link>
      </div>
    );
  }

  // 3. Nếu CHƯA MUA -> Hiện nút "Thêm vào giỏ" bình thường
  return (
    <div className="flex flex-col gap-3 w-full">
        <div className="text-2xl font-bold">{price.toLocaleString()}đ</div>
        <Button 
            onClick={addToCart}
            className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg"
        >
            <ShoppingCart className="mr-2 w-5 h-5"/> Thêm vào giỏ hàng
        </Button>
    </div>
  );
};