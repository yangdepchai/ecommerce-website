import Link from "next/link";

import { generateTenantUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
    slug:string;
};


export const Navbar = ({slug}:Props) => {


    return (
        <nav className="h-20 border-b font-medium bg-white">
            <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
                
                <p className="text-xl">Thanh toán</p>
                <Button
                    variant="elevated"
                    asChild
                >
                    <Link href={generateTenantUrl(slug)}>
                        Tiếp tục mua sắm
                    </Link>
                </Button>
                
                
            </div>
        </nav>
    );
};

