"use client";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
// Thêm lại các import cần thiết cho auth
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface NavbarItem {
    href: string;
    children: React.ReactNode;
}

interface Props {
    items: NavbarItem[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NavbarSidebar = ({
    items,
    open,
    onOpenChange,
}: Props) => {
    // Lấy thông tin session người dùng
    const trpc = useTRPC();
    const session = useQuery(trpc.auth.session.queryOptions());

    // Class chung để tái sử dụng cho đẹp và đồng bộ
    const linkClasses = "w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium transition-colors";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="p-0 transition-none"
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                        Menu
                    </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
                    {/* Danh sách menu chính */}
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={linkClasses}
                            onClick={() => onOpenChange(false)}
                        >
                            {item.children}
                        </Link>
                    ))}

                    {/* Phần Đăng nhập / Đăng ký / Bảng điều khiển */}
                    <div className="border-t mt-auto">
                        {session.data?.user ? (
                            /* Nếu đã đăng nhập -> Hiện Bảng điều khiển */
                            <Link
                                onClick={() => onOpenChange(false)}
                                href="/admin"
                                className={linkClasses}
                            >
                                Bảng điều khiển
                            </Link>
                        ) : (
                            /* Nếu chưa đăng nhập -> Hiện Đăng nhập & Đăng ký */
                            <>
                                <Link
                                    onClick={() => onOpenChange(false)}
                                    href="/sign-in"
                                    className={linkClasses}
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    onClick={() => onOpenChange(false)}
                                    href="/sign-up"
                                    className={linkClasses}
                                >
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};