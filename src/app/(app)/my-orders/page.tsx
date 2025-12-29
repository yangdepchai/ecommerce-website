"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query"; 
import { Loader2, Key, Download, Copy, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const trpc = useTRPC();
  
  // Gọi API lấy danh sách đơn hàng
  const { data: orders, isLoading } = useQuery(
    trpc.user.getMyOrders.queryOptions()
  );

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div>;

  // Kiểm tra orders có phải mảng không và có phần tử không
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Package size={64} className="text-gray-300"/>
            <p className="text-gray-500">Bạn chưa mua sản phẩm nào.</p>
            <Link href="/" className="bg-black text-white px-4 py-2 rounded">Mua sắm ngay</Link>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Kho hàng của tôi</h1>
      <div className="space-y-6">
        {/* SỬA LỖI TẠI ĐÂY: Thêm (orders as any[])?.map để ép kiểu mảng */}
        {(orders as any[])?.map((order: any) => (
          <div key={order.id} className="border rounded-lg p-5 bg-white shadow-sm">
             <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div>
                    <span className="font-bold text-gray-700">Đơn hàng #{order.payosOrderCode}</span>
                    <span className="text-sm text-gray-400 ml-3">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">
                    {order.status}
                </span>
             </div>

             <div className="space-y-4">
                {order.items.map((item: any) => (
                   <PurchasedItem key={item.id} product={item.product} />
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component con: Xử lý hiển thị từng sản phẩm
const PurchasedItem = ({ product }: { product: any }) => {
    const trpc = useTRPC();
    
    // Gọi API lấy nội dung mật (lazy fetch - chỉ gọi khi cần)
    const { data, refetch, isFetching } = useQuery({
        ...trpc.paidProduct.getContent.queryOptions({ productId: product.id }),
        enabled: false, 
    });

    return (
        <div className="flex gap-4 items-start">
            <div className="w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden border">
                {product.image?.url ? (
                    <Image src={product.image.url} alt={product.name} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package/></div>
                )}
            </div>
            
            <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                
                <div className="mt-3">
                    {/* Nút bấm lấy nội dung */}
                    {!data && !isFetching && (
                        <button 
                            onClick={() => refetch()}
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                        >
                            <Key size={16} /> Truy cập nội dung
                        </button>
                    )}

                    {isFetching && <span className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Đang giải mã...</span>}
                    
                    {/* Khu vực hiển thị kết quả */}
                    {data && (
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-2 animate-in fade-in slide-in-from-top-2">
                            
                            {/* Trường hợp là Text (Key/Account) */}
                            {data.type === 'text' && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase">Thông tin bản quyền:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-white border px-3 py-2 rounded flex-1 font-mono text-sm break-all">
                                            {data.text || "Chưa cập nhật nội dung"}
                                        </code>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(data.text);
                                                toast.success("Đã sao chép!");
                                            }}
                                            className="p-2 hover:bg-gray-200 rounded"
                                            title="Sao chép"
                                        >
                                            <Copy size={18} className="text-gray-600"/>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Trường hợp là File */}
                            {data.type === 'file' && data.file && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase">Tài liệu đính kèm:</p>
                                    <a 
                                        href={data.file.url} 
                                        target="_blank" 
                                        download
                                        className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
                                    >
                                        <Download size={18}/> Tải xuống: {data.file.filename}
                                    </a>
                                </div>
                            )}
                            
                            {!data.text && !data.file && (
                                <p className="text-red-500 text-sm">Sản phẩm này chưa được cập nhật nội dung. Vui lòng liên hệ Admin.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrdersPage;