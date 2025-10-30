import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";


import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CategoriesGetManyOutput, CategoriesGetManyOutputSingle } from "@/modules/categories/types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    //data: CustomCategory[];
};

export const CategoriesSidebar = ({
    open,
    onOpenChange,
    //data,

}: Props) => {
    const trpc = useTRPC();
    const{ data }= useQuery(trpc.categories.getMany.queryOptions());
    const router = useRouter();

    const [parentCategories, setParentCategories] = useState<CategoriesGetManyOutput | null >(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoriesGetManyOutput[1] | null >(null);

    const currentCategories = parentCategories ?? data ?? [];
    const handleOpenChange = (open: boolean) => {
        setSelectedCategory(null);
        setParentCategories(null);
        onOpenChange(open);
    };

    const handleCategoryClick=(category:CategoriesGetManyOutput[1]) =>{
        if (category.subcategories && category.subcategories.length >0){
            setParentCategories(category.subcategories as CategoriesGetManyOutput);
            setSelectedCategory(category);
        }else{
            if(parentCategories && selectedCategory){
                router.push(`/${selectedCategory.slug}/${category.slug}`);
            }else{
                if (category.slug === "all"){
                    router.push("/");
                }else {
                    router.push(`/${category.slug}`);
                }
            }

            handleOpenChange(false);
        }
    }
    
    const handleBackClick = () => {
        if (parentCategories){
            setParentCategories(null);
            setSelectedCategory(null);
        }
    }

    const backgroundColor = selectedCategory?.color || "white";

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="left"
                className="p-0 transition-none"
                style={{backgroundColor}}            
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                        Danh mục
                    </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
                    {parentCategories && (
                        <button
                        onClick={handleBackClick}
                        className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                        >
                            <ChevronLeftIcon className="size-4 mr-2"/>
                            Back
                        </button>
                    )}
                    {currentCategories.map((category)=>(
                        <button
                            key={category.slug}
                            onClick={()=> handleCategoryClick(category)}
                            className="w-full text-left p-4 hover:bg-black hover:text-white flex justify-between items-center text-base font-medium cursor-pointer"
                        >
                            {category.name}
                            {category.subcategories && category.subcategories.length >0 &&(
                                <ChevronRightIcon className="size-4 "/>
                            )}
                        </button>
                    ))}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};