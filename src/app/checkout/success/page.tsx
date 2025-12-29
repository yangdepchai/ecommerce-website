"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trpcPureClient } from "@/trpc/pure-client"; 
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

const CheckoutSuccessPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  // State: loading | success (đã trả tiền) | cancelled (đã hủy) | pending (đang chờ)
  const [status, setStatus] = useState<"loading" | "success" | "cancelled" | "pending">("loading");

  useEffect(() => {
    if (!orderId) return;

    const checkStatus = async () => {
      try {
        console.log("--> Gọi API check status...");
        const res = await trpcPureClient.payment.checkOrderStatus.mutate({ orderId });
        
        if (res.status === "paid") {
            setStatus("success");
        } else if (res.status === "cancelled") {
            setStatus("cancelled");
        } else {
            setStatus("pending");
        }
      } catch (error) {
        console.error("Lỗi:", error);
        setStatus("pending");
      }
    };

    // Gọi check ngay lập tức khi vào trang
    checkStatus();
  }, [orderId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-800">Đang cập nhật đơn hàng...</h1>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h1>
            <p className="text-gray-600 mt-2">Đơn hàng {orderId?.slice(-6)} đã được xác nhận.</p>
            <Link href="/" className="mt-6 px-6 py-2 bg-black text-white rounded-full">
              Tiếp tục mua sắm
            </Link>
          </div>
        )}

        {/* Giao diện khi Hủy */}
        {status === "cancelled" && (
          <div className="flex flex-col items-center">
            <XCircle className="w-20 h-20 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-600">Giao dịch đã hủy</h1>
            <p className="text-gray-600 mt-2">Đơn hàng {orderId?.slice(-6)} đã được chuyển sang trạng thái hủy.</p>
            <Link href="/" className="mt-6 px-6 py-2 border border-black rounded-full hover:bg-gray-100">
              Quay về trang chủ
            </Link>
          </div>
        )}

        {status === "pending" && (
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-20 h-20 text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold text-yellow-600">Chờ xác nhận</h1>
            <p className="text-gray-600 mt-2">Hệ thống chưa nhận được tín hiệu thanh toán.</p>
            <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full">
              Kiểm tra lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;