import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../init';

export const paidProductRouter = createTRPCRouter({
  getContent: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Ép kiểu để lấy db và session
      const { db, session } = ctx as any;

      if (!session || !session.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Bạn cần đăng nhập' });
      }

      // 1. Kiểm tra: User này đã có đơn hàng nào CHỨA sản phẩm này và đã PAID chưa?
      const orders = await db.find({
        collection: 'orders',
        where: {
          and: [
            { orderedBy: { equals: session.user.id } }, // Đơn của tôi
            { status: { equals: 'paid' } },             // Đã thanh toán
            { 'items.product': { equals: input.productId } } // Có sản phẩm này
          ]
        }
      });

      if (orders.docs.length === 0) {
         throw new TRPCError({ code: 'FORBIDDEN', message: 'Bạn chưa mua hoặc đơn chưa thanh toán xong.' });
      }

      // 2. Nếu đã mua -> Lấy nội dung mật từ Product
      const productRaw = await db.findByID({
        collection: 'products',
        id: input.productId,
      });
      
      if (!productRaw) throw new TRPCError({ code: 'NOT_FOUND' });

      // 3. Trả về dữ liệu (Lúc này mới lộ ra cho Frontend)
      return {
        type: productRaw.productType, 
        text: productRaw.payloadText, 
        file: productRaw.payloadFile, 
      };
    }),
});