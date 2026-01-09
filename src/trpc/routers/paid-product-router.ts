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

      // 1. Kiểm tra quyền sở hữu (Giữ nguyên)
      const orders = await db.find({
        collection: 'orders',
        where: {
          and: [
            { orderedBy: { equals: session.user.id } }, 
            { status: { equals: 'paid' } },            
            { 'items.product': { equals: input.productId } } 
          ]
        }
      });

      if (orders.docs.length === 0) {
         throw new TRPCError({ code: 'FORBIDDEN', message: 'Bạn chưa mua hoặc đơn chưa thanh toán xong.' });
      }

      // 2. Lấy sản phẩm (Giữ nguyên)
      const productRaw = await db.findByID({
        collection: 'products',
        id: input.productId,
      });
      
      if (!productRaw) throw new TRPCError({ code: 'NOT_FOUND' });

      // 3. --- SỬA ĐOẠN TRẢ VỀ (QUAN TRỌNG) ---
      // Mục tiêu: Không trả về 'url' gốc của file payloadFile
      
      const fileData = productRaw.payloadFile as any;

      return {
        type: productRaw.productType, 
        text: productRaw.payloadText, 
        // Thay vì trả nguyên cục fileData (có chứa url lộ), ta chỉ trả về filename
        file: fileData ? {
            filename: fileData.filename,
            filesize: fileData.filesize,
            // url: fileData.url <--- TUYỆT ĐỐI KHÔNG TRẢ VỀ CÁI NÀY
        } : null, 
      };
    }),
});