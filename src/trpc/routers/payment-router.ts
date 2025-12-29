import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, baseProcedure } from '../init';

// Interface
interface Order {
  id: string;
  total: number;
  status: string;
  payosOrderCode?: number;
  tenant?: string | { id: string;[key: string]: any };
  [key: string]: any;
}

interface Tenant {
  id: string;
  payosClientId?: string;
  payosApiKey?: string;
  payosChecksumKey?: string;
  [key: string]: any;
}

export const paymentRouter = createTRPCRouter({
  createPaymentLink: baseProcedure
    .input(z.object({
      orderId: z.string(),
      productId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: payload } = ctx;
      const product = await payload.findByID({
        collection: 'products',
        id: input.productId
      });
      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sản phẩm không tồn tại' });
      }
      if (product.isInfiniteStock === false && (product.stock ?? 0) <= 0) {
             throw new TRPCError({
                code: 'CONFLICT', // Mã lỗi xung đột
                message: 'Rất tiếc! Sản phẩm này vừa có người mua hết rồi.',
            });
      }
      // 1. Lấy đơn hàng
      const orderRaw = await payload.findByID({
        collection: 'orders' as any,
        id: input.orderId,
      });

      if (!orderRaw) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      const order = orderRaw as unknown as Order;

      if (order.status === 'paid') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Đơn hàng đã thanh toán' });
      }

      // 2. Lấy Tenant ID
      let tenantId: string = "";
      if (typeof order.tenant === 'string') {
        tenantId = order.tenant;
      } else if (order.tenant && typeof order.tenant === 'object') {
        tenantId = order.tenant.id;
      }

      if (!tenantId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Lỗi: Không tìm thấy Shop' });

      // 3. Lấy thông tin Tenant
      const tenantRaw = await payload.findByID({
        collection: 'tenants' as any,
        id: tenantId,
      });
      const tenant = tenantRaw as unknown as Tenant;

      if (!tenant.payosClientId || !tenant.payosApiKey || !tenant.payosChecksumKey) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Shop chưa cấu hình Key PayOS' });
      }
      if (product.isInfiniteStock === false && (product.stock ?? 0) <= 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Sản phẩm này vừa mới hết hàng!'
        });
      }
      try {
        // --- BƯỚC 1: SET ENV (Quan trọng) ---
        process.env.PAYOS_CLIENT_ID = String(tenant.payosClientId).trim();
        process.env.PAYOS_API_KEY = String(tenant.payosApiKey).trim();
        process.env.PAYOS_CHECKSUM_KEY = String(tenant.payosChecksumKey).trim();

        // --- BƯỚC 2: IMPORT DYNAMIC ---
        const payosModule = await import("@payos/node");
        const PayOSConstructor = (payosModule as any).PayOS || (payosModule as any).default;

        const payos = new PayOSConstructor(
          process.env.PAYOS_CLIENT_ID,
          process.env.PAYOS_API_KEY,
          process.env.PAYOS_CHECKSUM_KEY
        );

        // --- BƯỚC 3: TẠO LINK (Sửa lại đường dẫn hàm theo log X-Ray) ---
        const paymentOrderCode = order.payosOrderCode
          ? Number(order.payosOrderCode)
          : Number(String(Date.now()).slice(-10));

        const shortDescription = `Don ${paymentOrderCode}`.slice(0, 25);

        const domain = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
        const cancelUrl = `${domain}/checkout/success?orderId=${order.id}&cancel=true`;
        const returnUrl = `${domain}/checkout/success?orderId=${order.id}`;

        console.log("--> Đang gọi API PayOS...");

        // SỬA TẠI ĐÂY: Dùng payos.paymentRequests.create
        // (Hoặc fallback về createPaymentLink nếu version thay đổi)
        let res;
        if (payos.paymentRequests && typeof payos.paymentRequests.create === 'function') {
          // Case 1: Version mới (Namespace)
          res = await payos.paymentRequests.create({
            orderCode: paymentOrderCode,
            amount: order.total,
            description: shortDescription,
            cancelUrl: cancelUrl,
            returnUrl: returnUrl,
          });
        } else if (typeof payos.createPaymentLink === 'function') {
          // Case 2: Version cũ (Direct)
          res = await payos.createPaymentLink({
            orderCode: paymentOrderCode,
            amount: order.total,
            description: `Don ${order.id}`,
            cancelUrl: `${domain}/cart?canceled=true`,
            returnUrl: `${domain}/checkout/success?orderId=${order.id}`
          });
        } else {
          throw new Error("Không tìm thấy hàm tạo thanh toán (createPaymentLink hoặc paymentRequests.create)");
        }

        console.log("--> THÀNH CÔNG! Link:", res.checkoutUrl);
        return { url: res.checkoutUrl };

      } catch (e: any) {
        console.error("--> LỖI PayOS:", e);
        // Clean env
        delete process.env.PAYOS_CLIENT_ID;
        delete process.env.PAYOS_API_KEY;
        delete process.env.PAYOS_CHECKSUM_KEY;

        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message });
      }
    }),
  checkOrderStatus: baseProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: payload } = ctx;

      console.log(`\n--> [CHECK STATUS] Bắt đầu kiểm tra đơn: ${input.orderId}`);

      // 1. Tìm đơn hàng
      const orderRaw = await payload.findByID({
        collection: 'orders' as any,
        id: input.orderId,
      });

      if (!orderRaw) throw new TRPCError({ code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
      const order = orderRaw as unknown as Order;

      // 2. Lấy Tenant & Key
      let tenantId: string = "";
      if (typeof order.tenant === 'string') {
        tenantId = order.tenant;
      } else if (order.tenant && typeof order.tenant === 'object') {
        tenantId = order.tenant.id;
      }

      const tenantRaw = await payload.findByID({
        collection: 'tenants' as any,
        id: tenantId,
      });
      const tenant = tenantRaw as unknown as Tenant;

      if (!tenant.payosClientId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Thiếu cấu hình Tenant' });
      }

      // 3. Khởi tạo PayOS
      try {
        const payosModule = await import("@payos/node");
        const PayOSConstructor = (payosModule as any).PayOS || (payosModule as any).default;

        // Setup ENV
        process.env.PAYOS_CLIENT_ID = String(tenant.payosClientId).trim();
        process.env.PAYOS_API_KEY = String(tenant.payosApiKey).trim();
        process.env.PAYOS_CHECKSUM_KEY = String(tenant.payosChecksumKey).trim();

        const payos = new PayOSConstructor(
          process.env.PAYOS_CLIENT_ID,
          process.env.PAYOS_API_KEY,
          process.env.PAYOS_CHECKSUM_KEY
        );

        if (!order.payosOrderCode) {
          console.error("--> [LỖI] Đơn hàng không có payosOrderCode");
          return { status: 'pending' };
        }

        console.log(`--> [CHECK STATUS] Gọi API PayOS lấy info đơn: ${order.payosOrderCode}`);

        // --- SỬA LỖI TẠI ĐÂY: CHECK CẤU TRÚC HÀM ---
        let paymentLinkInfo;
        if (payos.paymentRequests && typeof payos.paymentRequests.get === 'function') {
          paymentLinkInfo = await payos.paymentRequests.get(order.payosOrderCode);
        } else if (typeof payos.getPaymentLinkInformation === 'function') {
          paymentLinkInfo = await payos.getPaymentLinkInformation(order.payosOrderCode);
        }
        // ---------------------------------------------

        console.log("--> [PAYOS RESPONSE STATUS]:", paymentLinkInfo.status);

        // 5. Cập nhật DB
        if (paymentLinkInfo.status === "PAID" || paymentLinkInfo.status === "Paid") {
          console.log("🔥 [Active Check] Đơn hàng đã thanh toán. Tiến hành cập nhật...");

          // 1. Cập nhật trạng thái đơn hàng
          await payload.update({
            collection: 'orders',
            id: order.id,
            data: { status: 'paid' }
          });

          // 2. --- THÊM LOGIC TRỪ TỒN KHO TẠI ĐÂY ---
          if (order.items && order.items.length > 0) {
            for (const item of order.items) {
              // Lấy ID sản phẩm
              const productId = typeof item.product === 'object' ? item.product.id : item.product;

              // Lấy thông tin mới nhất của sản phẩm
              const product = await payload.findByID({ collection: 'products', id: productId });

              // Logic kiểm tra hàng giới hạn (Legacy safe: so sánh === false)
              // Nếu isInfiniteStock là false (Hàng giới hạn) VÀ Stock > 0
              if (product.isInfiniteStock === false && (product.stock ?? 0) > 0) {

                await payload.update({
                  collection: 'products',
                  id: productId,
                  data: {
                    // Trừ đi 1
                    stock: (product.stock ?? 0) - 1
                  }
                });
                console.log(`✅ Đã trừ kho SP: ${product.name}. Còn lại: ${(product.stock ?? 0) - 1}`);
              }
            }
          }
          // ----------------------------------------

          return { status: 'paid' };
        }

        // QUAN TRỌNG: Xử lý trạng thái HỦY
        else if (paymentLinkInfo.status === "CANCELLED") {
          await payload.update({
            collection: 'orders',
            id: order.id,
            data: { status: 'cancelled' }
          });
          return { status: 'cancelled' };
        }

        return { status: 'pending' };

      } catch (error: any) {
        console.error("--> [LỖI CHECK]:", error.message);
        return { status: order.status };
      }
    }),
});