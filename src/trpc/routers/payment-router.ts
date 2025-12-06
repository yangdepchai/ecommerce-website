import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, baseProcedure } from '../init';

// Interface
interface Order {
  id: string;
  total: number;
  status: string;
  payosOrderCode?: number;
  tenant?: string | { id: string; [key: string]: any };
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
    }))
    .mutation(async ({ ctx, input }) => {
      const { db: payload } = ctx;

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
                cancelUrl: `${domain}/cart?canceled=true`,
                returnUrl: `${domain}/checkout/success?orderId=${order.id}`
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
});