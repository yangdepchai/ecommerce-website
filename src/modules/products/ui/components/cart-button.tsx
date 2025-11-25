import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/checkout/hooks/use-cart";
import { cn } from "@/lib/utils";

interface Props {
    tenantSlug: string;
    productId: string;
};

export const CartButton = ({ tenantSlug,productId }: Props) => {
    const cart = useCart(tenantSlug);
    return (
        <Button 
            variant="elevated"
            className={cn("flex-1 bg-white text-black", cart.isProductInCart(productId) && "bg-black text-white")}
            onClick={() => cart.toggleProduct(productId)}
        >
            {cart.isProductInCart(productId) 
                ? "Xóa khỏi giỏ hàng"  
                : "Thêm vào giỏ hàng"
            }
        </Button>
    )
}