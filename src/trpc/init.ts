import { initTRPC, TRPCError } from '@trpc/server';
import config from "@payload-config";
import { getPayload } from 'payload';
import { cache } from 'react';
import superjson from "superjson";
import { headers as getHeaders } from 'next/headers';

// 1. Context: Chạy ở mỗi Request
export const createTRPCContext = cache(async () => {


  try {
    const payload = await getPayload({ config });
    
    const headers = await getHeaders();

    const authResult = await payload.auth({ headers });

    const user = authResult?.user || null;
    const userId = user?.id || null;

    return {
        db: payload,
        payload,
        user,
        userId
    };

  } catch (err) {

    
    // Trả về context rỗng để server không sập hẳn, nhưng sẽ log ra lỗi
    const payload = await getPayload({ config });
    return {
        db: payload,
        payload,
        user: null,
        userId: null
    };
  }
});

// Định nghĩa kiểu Context
type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// 2. Base Procedure
export const baseProcedure = t.procedure.use(async ({ next, ctx }) => {
  return next({
    ctx: {
      ...ctx,
      db: ctx.db,
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});

// 3. Protected Procedure
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bạn chưa đăng nhập!",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        user: ctx.user,
      },
    },
  });
});