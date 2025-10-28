"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavbarSidebar } from "./navbar-sidebar";
import { useState } from "react";
import { MenuIcon } from "lucide-react";


const poppins = Poppins({
    subsets: ["latin"],
    weight:["700"],
}
);

interface NavbarItemProps {
    href:string;
children :React.ReactNode;
isActive?:boolean;
}

const NavbarItem =({
    href,
    children,
    isActive,
}:NavbarItemProps)=>{
    return (
        <Button 
            variant="outline"
            className={cn(
                "bg-transparent hover:bg-transparent rounded-full hover:border-primary border-transparent px-3.5 text-lg",
                isActive && "bg-black text-white hover:bg-black hover:text-white",
            )}
        >
            <Link href={href}>
                {children}
            </Link>
            
        </Button>
    );
};

const navbarItems = [
    {href:"/",children:"Trang chủ"},
    {href:"/about",children:"Giới thiệu"},
    {href:"/features",children:"Tính năng"},
    {href:"/pricing",children:"Giá cả"},
    {href:"/contact",children:"Liên hệ"},
];

export const Navbar = ()=>{
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen]=useState(false);

    return (
        <nav className="h-20 flex border-b justify-between font-medium bg-white">
           <Link href="" className="pl-6 flex items-center">
                <span className={cn("text-5xl font-semibold",poppins.className)}>
                    marketplace
                </span>
           </Link>

            <NavbarSidebar
                items={navbarItems}
                open={isSidebarOpen}
                onOpenChange={setIsSidebarOpen}
            />

            <div className="items-center gap-4 hidden lg:flex">
                {navbarItems.map((item) => (
                    <NavbarItem
                        key={item.href}
                        href={item.href}    
                        isActive={pathname=== item.href}               
                    >
                        {item.children}
                    </NavbarItem>   
                ))}
            </div>  

            <div className="hidden lg:flex">
                <Button
                    asChild
                    variant="secondary"
                    className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-white hover:bg-black hover:text-white transition-colors text-lg"
                >
                    <Link prefetch href="/sign-in">
                    Đăng nhập
                    </Link>
            
                </Button>
                <Button
                    asChild
                    variant="secondary"
                    className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-white hover:bg-black hover:text-white transition-colors text-lg"
                >
                    <Link prefetch href="/sign-up">
                    Đăng ký
                    </Link>
                </Button>
            </div>
            <div className="flex lg:hidden items-center justify-center">
                <Button
                    variant="ghost"
                    className="size-12 border-transparent bg-white"
                    onClick={()=>setIsSidebarOpen(true)}
                >
                    <MenuIcon/>
                </Button>

            </div>

        </nav>
    );

};