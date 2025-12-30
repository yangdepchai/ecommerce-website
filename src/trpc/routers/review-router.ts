import { z } from 'zod';
import { createTRPCRouter, baseProcedure, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';

export const reviewRouter = createTRPCRouter({
  // 1. Lấy danh sách review của 1 sản phẩm (Công khai)
  getReviewsByProduct: baseProcedure
    .input(z.object({ 
        productId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(5)
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const reviews = await db.find({
        collection: 'reviews',
        where: {
          product: { equals: input.productId },
        },
        limit: input.limit,
        page: input.page,
        sort: '-createdAt', // Mới nhất lên đầu
        depth: 1, // Để lấy thông tin user (tên, avatar)
      });
      return reviews;
    }),

  // 2. Viết review (Cần đăng nhập)
  createReview: protectedProcedure
    .input(z.object({
      productId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().min(5, "Bình luận phải ít nhất 5 ký tự"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      if (!user) {
         throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // --- 1. KIỂM TRA ĐÃ MUA HÀNG CHƯA ---
      const hasPurchased = await db.find({
          collection: 'orders',
          where: {
              and: [
                  { orderedBy: { equals: user.id } }, // Của user này
                  { status: { equals: 'paid' } },     // Đã thanh toán
                  { 'items.product': { equals: input.productId } } // Chứa sản phẩm này
              ]
          }
      });

      if (hasPurchased.docs.length === 0) {
          throw new TRPCError({ 
              code: 'FORBIDDEN', 
              message: "Bạn cần mua sản phẩm này trước khi đánh giá!" 
          });
      }
      // -------------------------------------

      // 2. Check xem đã review chưa
      const existingReview = await db.find({
          collection: 'reviews',
          where: {
              and: [
                  { product: { equals: input.productId } },
                  { user: { equals: user.id } }
              ]
          }
      });

      if (existingReview.totalDocs > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: "Bạn đã đánh giá sản phẩm này rồi!" });
      }

      // 3. Tạo review
      await db.create({
        collection: 'reviews',
        data: {
          product: input.productId,
          user: user.id,
          rating: input.rating,
          comment: input.comment,
        },
      });

      return { success: true };
    }),
});