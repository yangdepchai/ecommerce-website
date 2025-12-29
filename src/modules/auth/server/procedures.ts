import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { headers as getHeaders } from "next/headers";
import { z } from "zod";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";

export const authRouter = createTRPCRouter({
    session: baseProcedure.query(async ({ ctx }) => {
        const headers = await getHeaders();
        const session = await ctx.db.auth({ headers });
        return session;
    }),
    register: baseProcedure
        .input(registerSchema)
        .mutation(async ({ input, ctx }) => {
            // 1. Kiểm tra username
            const existingUser = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: {
                    username: { equals: input.username },
                },
            });

            if (existingUser.docs.length > 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Tên người dùng đã tồn tại"
                });
            }

            // 2. Kiểm tra email
            const existingEmail = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: {
                    email: { equals: input.email },
                },
            });

            if (existingEmail.docs.length > 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Email đã được sử dụng"
                });
            }

            // 3. XỬ LÝ TENANT (FIX LỖI TS TẠI ĐÂY)
            let tenantId = "";
            
            const existingTenant = await ctx.db.find({
                collection: "tenants",
                where: { slug: { equals: input.username } },
                limit: 1
            });

            // --- SỬA ĐOẠN NÀY ĐỂ HẾT LỖI ---
            // Lấy phần tử đầu tiên ra biến riêng để TS hiểu kiểu dữ liệu
            const foundTenant = existingTenant.docs[0];

            if (foundTenant) {
                // Nếu tìm thấy -> Dùng lại ID cũ
                console.log("Tenant đã tồn tại, sử dụng lại ID:", foundTenant.id);
                tenantId = foundTenant.id;
            } else {
                // Chưa có -> Tạo mới
                console.log("Tạo Tenant mới:", input.username);
                const newTenant = await ctx.db.create({
                    collection: "tenants",
                    data: {
                        name: input.username,
                        slug: input.username,
                        payosClientId: input.payosClientId || "",
                        payosApiKey: input.payosApiKey || "",
                        payosChecksumKey: input.payosChecksumKey || "",
                    },
                });
                tenantId = newTenant.id;
            }
            // -------------------------------

            // 4. Tạo User
            await ctx.db.create({
                collection: "users",
                data: {
                    email: input.email,
                    username: input.username,
                    password: input.password,
                    tenants: [
                        {
                            tenant: tenantId,
                        },
                    ],
                },
            });

            // 5. Auto Login
            const data = await ctx.db.login({
                collection: "users",
                data: {
                    email: input.email,
                    password: input.password,
                },
            });

            if (!data.token) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Đăng ký thành công nhưng đăng nhập thất bại.",
                });
            }

            await generateAuthCookie({
                prefix: ctx.db.config.cookiePrefix,
                value: data.token,
            });
            
            return { success: true };
        }),
    login: baseProcedure
        .input(loginSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                const data = await ctx.db.login({
                    collection: "users",
                    data: {
                        email: input.email,
                        password: input.password,
                    },
                });
                if (!data.token) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "Sai email hoặc mật khẩu",
                    });
                }

                await generateAuthCookie({
                    prefix: ctx.db.config.cookiePrefix,
                    value: data.token,
                });

                return data;
            } catch (err) {
                 throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Sai email hoặc mật khẩu",
                });
            }
        }),
});