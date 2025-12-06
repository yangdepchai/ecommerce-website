import {  Media, Tenant } from "@/payload-types";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { z } from "zod";

import { TRPCError } from "@trpc/server";

export const checkoutRouter = createTRPCRouter({
    
    createOrder: protectedProcedure
    .input(z.object({
      tenantSlug: z.string(),
      productIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. FIX LỖI CONTEXT USER: Lấy session trước, user nằm trong session
      const { db: payload, session } = ctx;
      
      if (!session || !session.user) {
         throw new TRPCError({ code: "UNAUTHORIZED", message: "Bạn cần đăng nhập" });
      }
      const user = session.user;

      // 2. Tìm Tenant
      const tenants = await payload.find({
        collection: "tenants",
        where: { slug: { equals: input.tenantSlug } },
      });

      // 3. FIX LỖI UNDEFINED: Lấy biến ra trước, check biến đó tồn tại hay không
      const tenant = tenants.docs[0]; 

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cửa hàng không tồn tại" });
      }

      // 4. Lấy sản phẩm
      const products = await payload.find({
        collection: "products",
        where: {
          id: { in: input.productIds },
          tenant: { equals: tenant.id },
        },
      });

      if (!products.docs.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Giỏ hàng rỗng" });
      }

      let totalAmount = 0;
      const orderItems = products.docs.map((product: any) => {
        const price = product.price || 0;
        totalAmount += price;
        return {
          product: product.id,
          quantity: 1,
          price: price,
        };
      });

      // 5. Tạo đơn hàng
      const order = await payload.create({
        collection: "orders",
        data: {
          tenant: tenant.id, // Ở đây TypeScript đã biết tenant chắc chắn tồn tại
          orderedBy: user.id,
          items: orderItems,
          total: totalAmount,
          status: "pending",
        },
      });

      return { orderId: order.id };
    }),
    getProducts: baseProcedure
        .input(
            z.object({
                ids:z.array(z.string()),
            }),
        )
        .query(async({ctx,input})=>{

            const data = await ctx.db.find({
                collection: 'products',
                depth:2,
                where: {
                    id: {
                        in: input.ids,
                    },
                },
                
            });

            if (data.totalDocs !== input.ids.length) {
                throw new TRPCError({ code: "NOT_FOUND", message:"Không tìm thấy sản phẩm"});
            }
            
            return {
                ...data,
                totalPrice: data.docs.reduce((acc,product)=> acc + product.price,0),
                docs:data.docs.map((doc)=> ({
                    ...doc,
                    image: doc.image as Media | null,
                    tenant: doc.tenant as Tenant & {image: Media | null} ,
                }))
            }
        }),
});