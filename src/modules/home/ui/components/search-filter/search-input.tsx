"use client";

import { Input } from "@/components/ui/input";
import { BookOpen, ListFilterIcon, SearchIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CategoriesGetManyOutput } from "@/modules/categories/types";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CategoriesSidebar } from "./categories-sidebar";

import { useProductFilters } from "@/modules/products/hooks/use-product-filters";

interface Props {
    disabled?: boolean;
    data?: CategoriesGetManyOutput;
};

export const SearchInput = ({
    disabled,
    data, // data có thể undefined nếu chưa fetch xong
}: Props) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // 2. Dùng nuqs để lấy và set giá trị q
    const [filters, setFilters] = useProductFilters();
    
    // 3. State nội bộ để gõ chữ mượt mà (tránh giật lag khi gõ nhanh)
    const [searchTerm, setSearchTerm] = useState(filters.q || "");

    const trpc = useTRPC();
    const session = useQuery(trpc.auth.session.queryOptions());

    // 4. Đồng bộ ngược: Nếu URL thay đổi (ví dụ F5 lại), cập nhật vào ô input
    useEffect(() => {
        setSearchTerm(filters.q || "");
    }, [filters.q]);

    // 5. Logic Debounce: Ngừng gõ 500ms mới đẩy lên URL
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Nếu giá trị hiện tại khác với giá trị trên URL thì mới update
            if (searchTerm !== (filters.q || "")) {
                setFilters({ q: searchTerm || null }); // null để xóa khỏi URL nếu rỗng
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters.q, setFilters]);

    const handleClear = () => {
        setSearchTerm("");
        setFilters({ q: null }); // Xóa ngay lập tức
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <CategoriesSidebar 
                open={isSidebarOpen} 
                onOpenChange={setIsSidebarOpen} 
            />
            
            <div className="relative w-full">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                
                <Input 
                    className="pl-8 pr-8 h-12 text-base" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    disabled={disabled} 
                    
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && (
                    <button 
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-neutral-400 hover:text-black transition"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            <Button
                variant="outline"
                className="size-12 shrink-0 flex lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
            >
                <ListFilterIcon size={20} />
            </Button>
            
            {session.data?.user && (
                <Button
                    asChild
                    variant="default" // Đổi màu cho nổi bật
                    className="h-12 shrink-0 bg-black text-white hover:bg-gray-800"
                >
                    <Link href="/my-orders">
                        <BookOpen size={18} />
                        <span className="hidden md:inline ml-2 font-medium">Đã mua</span>
                    </Link>
                </Button>
            )}
        </div>
    );
};