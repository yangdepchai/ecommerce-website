// src/collections/Reviews.ts
import { CollectionConfig } from 'payload';

const updateProductRating = async ({ doc, req, operation }: any) => {
  const { payload } = req;
  
  try {
      const productId = typeof doc.product === 'object' ? doc.product.id : doc.product;
      if (!productId) return doc;

      // 1. Lấy danh sách review
      const reviewsQuery = await payload.find({
        collection: 'reviews',
        where: { product: { equals: productId } },
        limit: 0,
      });

      let currentReviews = reviewsQuery.docs;

      // 2. Logic Fix Lag (Giữ nguyên logic cũ)
      if (operation === 'create') {
          const exists = currentReviews.find((r: any) => r.id === doc.id);
          if (!exists) currentReviews.push(doc);
      } 
      else if (operation === 'update') {
          currentReviews = currentReviews.map((r: any) => r.id === doc.id ? doc : r);
      }
      else if (!operation) { // Delete
          currentReviews = currentReviews.filter((r: any) => r.id !== doc.id);
      }

      const totalReviews = currentReviews.length;
      
      // 3. --- TÍNH TOÁN MỚI: ĐẾM SỐ LƯỢNG TỪNG SAO ---
      const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      let totalRating = 0;

      currentReviews.forEach((review: any) => {
          const rating = review.rating || 0;
          totalRating += rating;
          
          // Cộng dồn vào object starCounts
          if (rating >= 1 && rating <= 5) {
              // @ts-ignore
              starCounts[rating]++;
          }
      });
      // -----------------------------------------------

      const averageRating = totalReviews > 0 
          ? parseFloat((totalRating / totalReviews).toFixed(1)) 
          : 0;

      console.log(`📊 Stats: SL=${totalReviews} | TB=${averageRating} | Chi tiết=`, starCounts);

      // 4. Update Product (Thêm field starCounts)
      await payload.update({
        collection: 'products',
        id: productId,
        data: {
          reviewCount: totalReviews,
          rating: averageRating,
          starCounts: starCounts, // Lưu object đếm vào DB
        },
      });

  } catch (error) {
      console.error("❌ Lỗi tính rating:", error);
  }

  return doc;
};

// ... (Phần export Review Config giữ nguyên)
export const Reviews: CollectionConfig = {
    // ... Giữ nguyên nội dung bên dưới
    slug: 'reviews',
    admin: { useAsTitle: 'comment' },
    access: {
        read: () => true,
        create: ({ req }) => !!req.user,
        update: ({ req }) => req.user ? { user: { equals: req.user.id } } : false,
        delete: ({ req }) => req.user ? { user: { equals: req.user.id } } : false,
    },
    hooks: {
        afterChange: [updateProductRating],
        afterDelete: [updateProductRating],
    },
    fields: [
        // ... Giữ nguyên các fields
        {
            name: 'product',
            type: 'relationship',
            relationTo: 'products',
            required: true,
            hasMany: false,
        },
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            hasMany: false,
            defaultValue: ({ req }: any) => req.user?.id,
            admin: { readOnly: true }
        },
        {
            name: 'rating',
            type: 'number',
            required: true,
            min: 1,
            max: 5,
        },
        {
            name: 'comment',
            type: 'textarea',
            required: true,
        },
    ]
};