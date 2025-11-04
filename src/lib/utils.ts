import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// (Đặt hàm này ở đâu đó, ví dụ: /lib/utils.ts)

export function formatPrice(
  price: number | string,
  options: {
    currency?: 'VND' | 'USD';
    notation?: 'compact' | 'standard';
  } = {}
) {
  const { currency = 'VND', notation = 'standard' } = options;
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal', // Dùng 'decimal' để chỉ lấy số
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation,
  }).format(numericPrice);
}