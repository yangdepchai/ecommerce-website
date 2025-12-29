import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";

export const userRouter = createTRPCRouter({
  // 1. API lấy danh sách đơn hàng đã mua của User đang đăng nhập
  getMyOrders: protectedProcedure
    .query(async ({ ctx }) => {
      // Ép kiểu context để lấy db (payload) và session an toàn
      const { db, session } = ctx as any;

      // Kiểm tra đăng nhập (Dù protectedProcedure đã check, thêm 1 lớp nữa cho chắc chắn type)
      if (!session || !session.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Bạn chưa đăng nhập" });
      }

      // Query vào Collection Orders
      const orders = await db.find({
        collection: "orders",
        where: {
          and: [
            // Lọc theo ID của người dùng hiện tại
            { orderedBy: { equals: session.user.id } },
            // Chỉ lấy đơn đã thanh toán thành công
            { status: { equals: "paid" } },
          ],
        },
        depth: 2, // Populate sâu để lấy được thông tin chi tiết Product (ảnh, tên...)
        sort: "-createdAt", // Đơn mới nhất lên đầu
      });

      return orders.docs;
    }),

  // 2. (Bonus) API lấy thông tin Profile của chính mình (nếu cần hiển thị avatar/tên)
  getMe: protectedProcedure
    .query(async ({ ctx }) => {
      const { db, session } = ctx as any;
      
      if (!session || !session.user) {
        return null;
      }

      const me = await db.findByID({
        collection: "users",
        id: session.user.id,
      });

      return me;
    }),
});