import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { authRouter } from '@/modules/auth/server/procedures';
import { productRouter } from '@/modules/products/server/procedures';
import { tagsRouter } from '@/modules/tags/server/procedures';
import { tenantsRouter } from '@/modules/tenants/server/procedures';
import { checkoutRouter } from '@/modules/checkout/server/procedures';
import { paymentRouter } from './payment-router';
import { paidProductRouter } from './paid-product-router';
import { userRouter } from './user-router';
import { reviewRouter } from './review-router';


export const appRouter = createTRPCRouter({
  auth:authRouter,
  tags: tagsRouter,
  tenants: tenantsRouter,
  categories:categoriesRouter,
  checkout:checkoutRouter,
  payment:paymentRouter,
  products: productRouter,
  user: userRouter,
  paidProduct: paidProductRouter,
  reviews: reviewRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;