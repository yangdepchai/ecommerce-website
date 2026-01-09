import { Category, Media, Tenant } from "@/payload-types";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { Sort, Where } from "payload";
import { z } from "zod";
import { sortValues } from "../search-params";
import { DEFAULT_LIMIT } from "@/constants";

export const productRouter = createTRPCRouter({
    getOne: baseProcedure
    .input(
        z.object({
            id: z.string(),
        }),
    )
    .query(async({ctx,input})=>{
        const product = await ctx.db.findByID({
            collection: 'products',
            id: input.id,
            depth:2,
        });
        return {
            ...product,
            image: product.image as Media | null,
            tenant: product.tenant as Tenant & {image: Media | null} ,
        }
    }),
    getMany: baseProcedure
    .input(
        z.object({
            cursor: z.number().default(1),
            limit: z.number().default(DEFAULT_LIMIT),
            category: z.string().nullable().optional(),
            minPrice: z.string().nullable().optional(),
            maxPrice: z.string().nullable().optional(),
            tags: z.array(z.string()).nullable().optional(),
            sort: z.enum(sortValues).nullable().optional(),
            tenantSlug: z.string().nullable().optional(),
            q: z.string().optional(), // Đã có input
        }),
    )
    .query(async({ctx,input})=>{
        const where: Where = {};
        let sort: Sort = "-createdAt";

        if (input.sort === "default"){
            sort = "name";
        }
        if ( input.sort === "oldest"){
            sort = "createdAt";
        };
        if ( input.sort === "newest"){
            sort = "-createdAt";
        }
        
        // --- LOGIC TÌM KIẾM (Đã thêm) ---
        if (input.q) {
            where.name = {
                // Đổi 'contains' thành 'like' để hỗ trợ tìm kiếm tốt hơn trên Mongo
                like: input.q, 
            };
        }
        // -------------------------------

        if(input.minPrice){
            where.price ={
                greater_than_equal:input.minPrice
            }
        }
        if(input.maxPrice){
            where.price ={
                less_than_equal:input.maxPrice
            }
        }

        if (input.tenantSlug){
            where["tenant.slug"] = {
                equals: input.tenantSlug,
            }
        }

        if (input.category){
            const categoriesData = await ctx.db.find({
                collection: "categories",
                limit:1,
                depth:1,
                pagination: false,
                where:{
                    slug: {
                        equals: input.category,
                    }
                }
            });

            const formattedData = categoriesData.docs.map((doc) => ({
                        ...doc,
                        subcategories:(doc.subcategories?.docs ?? []).map((doc) =>({
                            ...(doc as Category),
                            subcategories:undefined,
                        }))
                      }));

            const subcategoriesSlugs = [];
            const parentCategory = formattedData[0];

            if (parentCategory){
                subcategoriesSlugs.push(
                    ...parentCategory.subcategories.map((subcategory) => subcategory.slug)
                )
                where["category.slug"] = {
                    in: [parentCategory.slug, ...subcategoriesSlugs]
                }    
            }
        }

        if (input.tags && input.tags.length > 0){
            where["tags.name"] = {
                in:input.tags,
            };
        };
        
        const data = await ctx.db.find({
            collection: 'products',
            depth:2,
            where, // Biến where này giờ đã chứa điều kiện tìm kiếm
            sort,
            page: input.cursor,
            limit: input.limit,
        });
        return {
            ...data,
            docs:data.docs.map((doc)=> ({
                ...doc,
                image: doc.image as Media | null,
                tenant: doc.tenant as Tenant & {image: Media | null} ,
            }))
        }
    }),
    checkOwnership: baseProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
       const { db, user, userId } = ctx as any;
       
       // Kiểm tra session user (lấy từ auth thật)
       const realUser = user || (ctx as any).session?.user;
       
       if (!realUser || !realUser.id) {
          return { isOwned: false };
       }

       // Đếm đơn hàng
       const count = await db.count({
          collection: 'orders',
          where: {
             and: [
                // Payload tự động so sánh ID kể cả khi orderedBy là object
                { orderedBy: { equals: realUser.id } }, 
                { status: { equals: 'paid' } },
                { 'items.product': { equals: input.productId } }
             ]
          }
       });

       return { isOwned: count.totalDocs > 0 };
    }),
});