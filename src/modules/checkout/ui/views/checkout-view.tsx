"use client";

import { useTRPC } from "@/trpc/client";
import { useCart } from "../../hooks/use-cart";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generateTenantUrl } from "@/lib/utils";
import { CheckoutItem } from "../components/checkout-item";
import { CheckoutSidebar } from "../components/checkout-sidebar";
import { InboxIcon, Loader2 } from "lucide-react";
// 1. Import các hook từ react-query
import { useQuery, useMutation } from "@tanstack/react-query";

interface CheckoutViewProps {
  tenantSlug: string;
}

export const CheckoutView = ({ tenantSlug }: CheckoutViewProps) => {
  const { productIds, removeProduct, clearAllCarts } = useCart(tenantSlug);
  const trpc = useTRPC(); 
  
  const [isProcessing, setIsProcessing] = useState(false);

  // 2. SỬA LỖI QUERY: Dùng useQuery bao bọc queryOptions
  const { data, error, isLoading } = useQuery(
    trpc.checkout.getProducts.queryOptions(
      { ids: productIds },
    )
  );

  // 3. SỬA LỖI MUTATION: Dùng useMutation bao bọc mutationOptions
  // Mutation B: Tạo link thanh toán
  const createPaymentLink = useMutation(
    trpc.payment.createPaymentLink.mutationOptions({
      onSuccess: (data) => {
          if (data?.url) {
              window.location.href = data.url;
          } else {
              setIsProcessing(false);
              toast.error("Không nhận được link thanh toán từ hệ thống");
          }
      },
      onError: (err) => {
          setIsProcessing(false);
          toast.error(`Lỗi tạo cổng thanh toán: ${err.message}`);
      }
    })
  );

  // Mutation A: Tạo đơn hàng
  const createOrder = useMutation(
    trpc.checkout.createOrder.mutationOptions({
      onSuccess: (orderData) => {
          // Check orderId
          if (orderData?.orderId) {
              // Gọi tiếp mutation tạo link
              createPaymentLink.mutate({ orderId: orderData.orderId, productId: "" }); 
              // Lưu ý: productId ở đây để trống hoặc string bất kỳ vì API createPaymentLink đang yêu cầu
              // Nếu backend đã sửa API createPaymentLink chỉ cần orderId thì bỏ productId đi.
          } else {
               setIsProcessing(false);
               toast.error("Không lấy được mã đơn hàng");
          }
      },
      onError: (err) => {
          setIsProcessing(false);
          toast.error(`Lỗi tạo đơn hàng: ${err.message}`);
      }
    })
  );

  const handleCheckout = () => {
    if (productIds.length === 0) {
        toast.warning("Giỏ hàng trống");
        return;
    }
    
    setIsProcessing(true);
    
    createOrder.mutate({
        tenantSlug: tenantSlug,
        productIds: productIds,
    });
  };

  useEffect(() => {
    if (error?.message?.includes("NOT_FOUND") || (error as any)?.data?.code === "NOT_FOUND") {
      clearAllCarts();
      toast.warning("Giỏ hàng đã được làm mới do có sản phẩm không tồn tại");
    }
  }, [error, clearAllCarts]);

  if (isLoading) {
    return (
      <div className="lg:pt-16 pt-4 px-4 lg:px-12 flex justify-center">
         <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  // Ép kiểu mảng để tránh lỗi "length of undefined"
  const products = data?.docs || [];

  if (!data || products.length === 0) {
    return (
      <div className="lg:pt-16 pt-4 px-4 lg:px-12">
        <div className="border border-dashed flex items-center justify-center p-16 flex-col gap-y-4 bg-white w-full rounded-lg text-gray-500">
          <InboxIcon size={64} />
          <p className="text-lg font-medium">Giỏ hàng của bạn đang trống</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pt-16 pt-4 px-4 lg:px-12 pb-20">
      <h1 className="text-2xl font-bold mb-6">Thanh toán giỏ hàng</h1>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-12">
        
        <div className="lg:col-span-4">
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            {/* 4. SỬA LỖI IMPLICIT ANY: Thêm kiểu :any cho biến trong map */}
            {products.map((product: any, index: number) => (
              <CheckoutItem
                key={product.id}
                isLast={index === products.length - 1}
                imageUrl={product.image?.url}
                name={product.name}
                productUrl={`${generateTenantUrl(product.tenant.slug)}/products/${product.id}`}
                tenantUrl={generateTenantUrl(product.tenant.slug)}
                tenantName={product.tenant.name}
                price={product.price}
                onRemove={() => removeProduct(product.id)}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="sticky top-20">
              <CheckoutSidebar
                total={data?.totalPrice || 0}
                onCheckout={handleCheckout} 
                isCancelled={false} 
                isPending={isProcessing}
              />
          </div>
        </div>
      </div>
    </div>
  );
};