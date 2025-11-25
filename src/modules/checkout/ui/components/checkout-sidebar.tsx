import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CircleXIcon } from "lucide-react";

interface CheckoutSidebarProps {
    total: number;
    onCheckout: () => void;
    isCancelled?:boolean;
    isPending?:boolean;
}

export const CheckoutSidebar = ({
    total,
    onCheckout,
    isCancelled,
    isPending,
}: CheckoutSidebarProps)=>{
    return (
        <div className="border rounded-md overflow-hidden bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-medium text-lg">Tổng tiền</h4>
                <p className="font-medium text-lg">
                    {formatPrice(total)}đ
                </p>
            </div>
            <div className="p-4 flex items-center justify-center">
                <Button
                    variant="elevated"
                    disabled={isPending}
                    onClick={onCheckout}
                    size="lg"
                    className="text-base w-full text-white bg-primary hover:bg-white hover:text-primary"
                >
                    Thanh toán
                </Button>
            </div>
            {isCancelled && (
                <div className="p-4 flex justify-center items-center border-t">
                    <div className="bg-red-100 border border-red-400 font-medium px-4 py-3 rounded flex items-center w-full">
                        <div className="flex items-center">
                            <CircleXIcon className="size-6 mr-2 fill-red-500 text-red-100"/>
                            <span>Thanh toán thất bại. Vui lòng thử lại</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}