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
      // SỬA 1: Cho phép productId là tùy chọn (optional) để hỗ trợ Giỏ hàng
      productId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: payload } = ctx;

      // SỬA 2: Chỉ check Stock lẻ nếu có productId (Mua ngay)
      // Nếu mua giỏ hàng (productId rỗng/undefined) thì bỏ qua bước này
      if (input.productId) {
          const product = await payload.findByID({
            collection: 'products',
            id: input.productId
          });
          
          if (!product) {
            // Nếu gửi ID mà tìm không thấy thì mới báo lỗi
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Sản phẩm không tồn tại' });
          }
          
          if (product.isInfiniteStock === false && (product.stock ?? 0) <= 0) {
              throw new TRPCError({
                  code: 'CONFLICT',
                  message: 'Rất tiếc! Sản phẩm này vừa có người mua hết rồi.',
              });
          }
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
        // SỬA 3: QUAN TRỌNG - Thêm overrideAccess để luôn lấy được Key PayOS
        overrideAccess: true, 
      });
      const tenant = tenantRaw as unknown as Tenant;

      if (!tenant.payosClientId || !tenant.payosApiKey || !tenant.payosChecksumKey) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Shop chưa cấu hình Key PayOS' });
      }

      try {
        // --- BƯỚC 1: SET ENV ---
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

        // --- BƯỚC 3: TẠO LINK ---
        const paymentOrderCode = order.payosOrderCode
          ? Number(order.payosOrderCode)
          : Number(String(Date.now()).slice(-10));

        const shortDescription = `Don ${paymentOrderCode}`.slice(0, 25);

        const domain = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
        const cancelUrl = `${domain}/checkout/success?orderId=${order.id}&cancel=true`;
        const returnUrl = `${domain}/checkout/success?orderId=${order.id}`;

        console.log("--> Đang gọi API PayOS...");

        let res;
        if (payos.paymentRequests && typeof payos.paymentRequests.create === 'function') {
          res = await payos.paymentRequests.create({
            orderCode: paymentOrderCode,
            amount: order.total,
            description: shortDescription,
            cancelUrl: cancelUrl,
            returnUrl: returnUrl,
          });
        } else if (typeof payos.createPaymentLink === 'function') {
          res = await payos.createPaymentLink({
            orderCode: paymentOrderCode,
            amount: order.total,
            description: `Don ${order.id}`,
            cancelUrl: `${domain}/cart?canceled=true`,
            returnUrl: `${domain}/checkout/success?orderId=${order.id}`
          });
        } else {
          throw new Error("Không tìm thấy hàm tạo thanh toán");
        }

        console.log("--> THÀNH CÔNG! Link:", res.checkoutUrl);
        return { url: res.checkoutUrl };

      } catch (e: any) {
        console.error("--> LỖI PayOS:", e);
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
        // SỬA 4: Thêm overrideAccess ở đây nữa cho chắc
        overrideAccess: true,
      });
      const tenant = tenantRaw as unknown as Tenant;

      if (!tenant.payosClientId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Thiếu cấu hình Tenant' });
      }

      // 3. Khởi tạo PayOS
      try {
        const payosModule = await import("@payos/node");
        const PayOSConstructor = (payosModule as any).PayOS || (payosModule as any).default;

        process.env.PAYOS_CLIENT_ID = String(tenant.payosClientId).trim();
        process.env.PAYOS_API_KEY = String(tenant.payosApiKey).trim();
        process.env.PAYOS_CHECKSUM_KEY = String(tenant.payosChecksumKey).trim();

        const payos = new PayOSConstructor(
          process.env.PAYOS_CLIENT_ID,
          process.env.PAYOS_API_KEY,
          process.env.PAYOS_CHECKSUM_KEY
        );

        if (!order.payosOrderCode) {
          return { status: 'pending' };
        }

        console.log(`--> [CHECK STATUS] Gọi API PayOS lấy info đơn: ${order.payosOrderCode}`);

        let paymentLinkInfo;
        if (payos.paymentRequests && typeof payos.paymentRequests.get === 'function') {
          paymentLinkInfo = await payos.paymentRequests.get(order.payosOrderCode);
        } else if (typeof payos.getPaymentLinkInformation === 'function') {
          paymentLinkInfo = await payos.getPaymentLinkInformation(order.payosOrderCode);
        }

        console.log("--> [PAYOS RESPONSE STATUS]:", paymentLinkInfo.status);

        // 5. Cập nhật DB
        if (paymentLinkInfo.status === "PAID" || paymentLinkInfo.status === "Paid") {
          console.log("🔥 [Active Check] Đơn hàng đã thanh toán. Tiến hành cập nhật...");

          await payload.update({
            collection: 'orders',
            id: order.id,
            data: { status: 'paid' }
          });

          // Logic trừ tồn kho
          if (order.items && order.items.length > 0) {
            for (const item of order.items) {
              const productId = typeof item.product === 'object' ? item.product.id : item.product;
              const product = await payload.findByID({ collection: 'products', id: productId });

              if (product.isInfiniteStock === false && (product.stock ?? 0) > 0) {
                await payload.update({
                  collection: 'products',
                  id: productId,
                  data: {
                    stock: (product.stock ?? 0) - 1
                  }
                });
                console.log(`✅ Đã trừ kho SP: ${product.name}. Còn lại: ${(product.stock ?? 0) - 1}`);
              }
            }
          }

          return { status: 'paid' };
        } else if (paymentLinkInfo.status === "CANCELLED") {
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