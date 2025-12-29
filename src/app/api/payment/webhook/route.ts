import { NextResponse } from "next/server";
import { getPayload } from "payload";
import configPromise from "@payload-config"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Kiểm tra dữ liệu đầu vào
    if (!body || !body.data || !body.data.orderCode) {
        return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }

    const { orderCode } = body.data;
    const { code } = body; 

    const payload = await getPayload({ config: configPromise });

    // Tìm đơn hàng
    const orders = await payload.find({
        collection: "orders",
        where: {
            payosOrderCode: { equals: orderCode },
        },
    });

    // --- SỬA LỖI TẠI ĐÂY ---
    // Lấy đơn hàng ra trước
    const order = orders.docs[0];

    // Kiểm tra trực tiếp biến 'order'. Nếu không có -> Báo lỗi ngay.
    // TypeScript sẽ hiểu sau dòng này, 'order' chắc chắn tồn tại (không undefined).
    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // -----------------------

    // Xử lý logic khi thanh toán thành công
    if (code == "00" && order.status !== 'paid') {
        
        console.log(`[Webhook] Thanh toán thành công đơn: ${orderCode}. Đang cập nhật...`);

        // 1. Cập nhật trạng thái đơn hàng -> Paid
        await payload.update({
            collection: "orders",
            id: order.id,
            data: {
                status: "paid",
            },
        });

        // 2. Trừ tồn kho
        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                // Lấy ID sản phẩm an toàn
                const productId = typeof item.product === 'object' ? item.product.id : item.product;

                try {
                    const product = await payload.findByID({
                        collection: 'products',
                        id: productId
                    });

                    // Nếu product tồn tại, không vô hạn và còn hàng -> Trừ stock
                    if (product.isInfiniteStock === false && (product.stock ?? 0) > 0) {
                        await payload.update({
                            collection: 'products',
                            id: productId,
                            data: {
                                stock: (product.stock ?? 0) - 1
                            }
                        });
                        console.log(`--> Đã trừ tồn kho cho sản phẩm: ${product.name}`);
                    }
                } catch (err) {
                    console.error(`Lỗi cập nhật tồn kho cho SP ${productId}:`, err);
                }
            }
        }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Webhook Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}