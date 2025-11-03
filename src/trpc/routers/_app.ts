import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { authRouter } from '@/modules/auth/server/procedures';
import { productRouter } from '@/modules/products/server/procedures';
import { tagsRouter } from '@/modules/tags/server/procedures';

export const appRouter = createTRPCRouter({
  auth:authRouter,
  tags: tagsRouter,
  categories:categoriesRouter,
  products: productRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;