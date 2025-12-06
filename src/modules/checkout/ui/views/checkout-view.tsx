"use client";

import { useTRPC } from "@/trpc/client";
import { trpcPureClient } from "@/trpc/pure-client"; // <--- 1. Import client thuần
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCart } from "../../hooks/use-cart";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generateTenantUrl } from "@/lib/utils";
import { CheckoutItem } from "../components/checkout-item";
import { CheckoutSidebar } from "../components/checkout-sidebar";
import { InboxIcon, LoaderIcon } from "lucide-react";

interface CheckoutViewProps {
  tenantSlug: string;
}

export const CheckoutView = ({ tenantSlug }: CheckoutViewProps) => {
  const { productIds, removeProduct, clearAllCarts } = useCart(tenantSlug);
  const trpc = useTRPC(); // Vẫn dùng cái này cho Query (getProducts)
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // 1. Query lấy sản phẩm (Giữ nguyên)
  const { data, error, isLoading } = useQuery(
    trpc.checkout.getProducts.queryOptions({
      ids: productIds,
    })
  );

  // 2. Fix Mutation: Tạo đơn hàng
  const createOrderMutation = useMutation({
    mutationFn: async (input: { tenantSlug: string; productIds: string[] }) => {
      // Dùng trpcPureClient để gọi .mutate()
      return await trpcPureClient.checkout.createOrder.mutate(input);
    },
    onSuccess: (data) => {
      // Gọi tiếp mutation tạo link
      createPaymentLinkMutation.mutate({ orderId: data.orderId });
    },
    onError: (err) => {
      setIsCheckingOut(false);
      toast.error(`Lỗi tạo đơn: ${err.message}`);
    },
  });

  // 3. Fix Mutation: Tạo link thanh toán
  const createPaymentLinkMutation = useMutation({
    mutationFn: async (input: { orderId: string }) => {
      // Dùng trpcPureClient để gọi .mutate()
      return await trpcPureClient.payment.createPaymentLink.mutate(input);
    },
    onSuccess: (data) => {
      // Redirect sang PayOS
      window.location.href = data.url;
    },
    onError: (err) => {
      setIsCheckingOut(false);
      toast.error(`Lỗi cổng thanh toán: ${err.message}`);
    },
  });

  const handleCheckout = () => {
    if (productIds.length === 0) return;
    
    setIsCheckingOut(true);
    
    // Gọi hàm mutate của React Query
    createOrderMutation.mutate({
        tenantSlug: tenantSlug,
        productIds: productIds,
    });
  };

  useEffect(() => {
    if (error?.data?.code === "NOT_FOUND") {
      clearAllCarts();
      toast.warning("Không có sản phẩm, giỏ hàng trống");
    }
  }, [error, clearAllCarts]);

  if (isLoading) {
    return (
      <div className="lg:pt-16 pt-4 px-4 lg:px-12">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
          <LoaderIcon className="text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  // ... (Phần UI render bên dưới giữ nguyên)
  if (!data || data.docs.length === 0) {
    return (
      <div className="lg:pt-16 pt-4 px-4 lg:px-12">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
          <InboxIcon />
          <p className="text-base font-medium">Không tìm thấy sản phẩm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pt-16 pt-4 px-4 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="border rounded-md overflow-hidden bg-white">
            {data?.docs.map((product, index) => (
              <CheckoutItem
                key={product.id}
                isLast={index === data.docs.length - 1}
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
          <CheckoutSidebar
            total={data?.totalPrice}
            onCheckout={handleCheckout}
            isCancelled={false} 
            isPending={isCheckingOut}
          />
        </div>
      </div>
    </div>
  );
};