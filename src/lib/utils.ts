import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTenantUrl(tenantSlug: string) {
  return `/tenants/${tenantSlug}`;
}

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