"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query"; 
import { Loader2, Key, Download, Copy, Package, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const trpc = useTRPC();
  
  // Gọi API lấy danh sách đơn hàng
  const { data: orders, isLoading } = useQuery(
    trpc.user.getMyOrders.queryOptions()
  );

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>;

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Package size={64} className="text-gray-300"/>
            <p className="text-gray-500">Bạn chưa mua sản phẩm nào.</p>
            <Link href="/">
                <button className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition">
                    Mua sắm ngay
                </button>
            </Link>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen pb-20">
      <h1 className="text-3xl font-bold mb-2">Kho hàng của tôi</h1>
      <p className="text-gray-500 mb-8">Danh sách các sản phẩm kỹ thuật số bạn đã sở hữu.</p>
      
      <div className="space-y-6">
        {(orders as any[])?.map((order: any) => (
          <div key={order.id} className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div className="flex flex-col">
                    <span className="font-bold text-gray-700">Đơn hàng #{order.payosOrderCode || order.id.slice(-6)}</span>
                    <span className="text-xs text-gray-400">
                        Ngày mua: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase border border-green-200">
                    {order.status === 'paid' ? 'Đã thanh toán' : order.status}
                </span>
             </div>

             <div className="space-y-6">
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
    
    // Gọi API lấy nội dung mật (lazy fetch - chỉ gọi khi bấm nút)
    const { data, refetch, isFetching } = useQuery({
        ...trpc.paidProduct.getContent.queryOptions({ productId: product.id }),
        enabled: false, 
    });

    return (
        <div className="flex gap-4 items-start">
            <div className="w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden border shrink-0">
                {product.image?.url ? (
                    <Image src={product.image.url} alt={product.name} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package/></div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" title={product.name}>{product.name}</h3>
                
                <div className="mt-3">
                    {/* Nút bấm lấy nội dung */}
                    {!data && !isFetching && (
                        <button 
                            onClick={() => refetch()}
                            className="text-sm bg-black hover:bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 transition font-medium"
                        >
                            <Key size={16} /> Truy cập nội dung
                        </button>
                    )}

                    {isFetching && (
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin"/> Đang xác thực...
                        </span>
                    )}
                    
                    {/* Khu vực hiển thị kết quả */}
                    {data && (
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-2 animate-in fade-in slide-in-from-top-2">
                            
                            {/* TRƯỜNG HỢP 1: TEXT / KEY / TÀI KHOẢN */}
                            {data.type === 'text' && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1">
                                        <Key size={12}/> Thông tin bản quyền:
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-white border px-3 py-2 rounded flex-1 font-mono text-sm break-all text-blue-600 font-bold">
                                            {data.text || "Chưa cập nhật nội dung"}
                                        </code>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(data.text);
                                                toast.success("Đã sao chép!");
                                            }}
                                            className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded transition"
                                            title="Sao chép"
                                        >
                                            <Copy size={18} className="text-gray-600"/>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TRƯỜNG HỢP 2: FILE / EBOOK (SỬA LỖI BẢO MẬT TẠI ĐÂY) */}
                            {data.type === 'file' && data.file && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1">
                                        <FileText size={12}/> Tài liệu đính kèm:
                                    </p>
                                    
                                    {/* Thay vì dùng data.file.url (link trần), ta dùng API Route bảo mật */}
                                    <a 
                                        href={`/api/download/ebook/${product.id}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition shadow-sm mt-1"
                                    >
                                        <Download size={16}/> 
                                        Tải xuống bảo mật (PDF)
                                    </a>
                                    
                                    <p className="text-[10px] text-gray-400 mt-2 italic">
                                        * File đã được đóng dấu bản quyền với email của bạn.
                                    </p>
                                </div>
                            )}
                            
                            {!data.text && !data.file && (
                                <p className="text-red-500 text-sm italic">
                                    Sản phẩm này chưa được cập nhật nội dung. Vui lòng liên hệ Admin.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrdersPage;