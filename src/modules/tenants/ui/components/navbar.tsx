"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { generateTenantUrl } from "@/lib/utils";

interface Props {
    slug: string;
}

export const Navbar = ({slug}:Props) => {

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.tenants.getOne.queryOptions({slug}));

    return (
        <nav className="h-20 border-b font-medium bg-white">
            <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
                <Link href={generateTenantUrl(slug)} className="flex items-center gap-2">
                    {data.image?.url && (
                        <Image
                            src={data.image.url}
                            width={32}
                            height={32}
                            alt={slug}
                            className="border rounded-full shrink-0 size-[32px]"
                        />
                    )}
                <p className="text-xl">{data.name}</p>
                
                </Link>
            </div>
        </nav>
    );
};

export const NavbarSkeleton = () => {
    return (
        <nav className="h-20 border-b font-medium bg-white">
            <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"/>
            </div>
        </nav>
    );
};