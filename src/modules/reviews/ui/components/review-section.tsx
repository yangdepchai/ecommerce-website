"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { StarIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const StarInput = ({ rating, setRating, disabled }: any) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => setRating(star)}
          className={cn(
            "transition-colors",
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
            !disabled && "hover:text-yellow-500"
          )}
        >
          <StarIcon className={cn("w-6 h-6", star <= rating && "fill-current")} />
        </button>
      ))}
    </div>
  );
};

export const ReviewSection = ({ productId }: { productId: string }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // 1. Query: Dùng (trpc as any) để tránh lỗi đỏ nếu Router chưa update type kịp
  const { data: rawReviewsData, isLoading } = useQuery(
     (trpc as any).reviews.getReviewsByProduct.queryOptions({
        productId,
        limit: 10
     })
  );

  // Ép kiểu dữ liệu trả về để TS hiểu có .docs
  const reviewsData = rawReviewsData as any;

  // 2. Mutation
  const createReview = useMutation(
     (trpc as any).reviews.createReview.mutationOptions({
        onSuccess: () => {
          toast.success("Cảm ơn đánh giá của bạn!");
          setComment("");
          queryClient.invalidateQueries({ queryKey: [['reviews']] });
          queryClient.invalidateQueries({ queryKey: [['products', 'getOne']] });
        },
        onError: (err: any) => {
          toast.error(err.message || "Có lỗi xảy ra");
        }
     })
  );

  const handleSubmit = () => {
    if (!comment.trim()) {
        toast.error("Vui lòng nhập nội dung đánh giá");
        return;
    }
    
    // 3. FIX LỖI "void": Ép kiểu input thành any để bỏ qua kiểm tra type chặt chẽ
    createReview.mutate({ 
        productId, 
        rating, 
        comment 
    } as any);
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h3>

      <div className="bg-gray-50 p-6 rounded-lg mb-8 border">
        <h4 className="font-semibold mb-4">Viết đánh giá của bạn</h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Chọn số sao:</span>
            <StarInput rating={rating} setRating={setRating} disabled={createReview.isPending} />
          </div>
          
          <Textarea 
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={createReview.isPending}
            className="bg-white"
          />
          
          <div className="flex justify-end">
            <Button 
                onClick={handleSubmit} 
                disabled={createReview.isPending}
                className="bg-black text-white hover:bg-gray-800"
            >
                {createReview.isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {isLoading ? (
            <p className="text-gray-500">Đang tải bình luận...</p>
        ) : !reviewsData || !reviewsData.docs || reviewsData.docs.length === 0 ? (
            <p className="text-center text-gray-500 italic py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        ) : (
            reviewsData.docs.map((review: any) => (
                <div key={review.id} className="flex gap-4 border-b pb-6 last:border-0">
                    <Avatar>
                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">
                                {review.user?.username || review.user?.email || "Người dùng ẩn danh"}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                        </div>
                        <div className="flex mb-2">
                             {[...Array(5)].map((_, i) => (
                                <StarIcon 
                                    key={i} 
                                    className={cn(
                                        "w-3 h-3", 
                                        i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    )} 
                                />
                             ))}
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};