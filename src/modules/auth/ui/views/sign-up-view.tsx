"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Poppins } from "next/font/google";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { registerSchema } from "@/modules/auth/schemas";
import { password } from "payload/shared";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";


const poppins = Poppins({
    subsets: ["latin"],
    weight:["700"],
}
);

export const SignUpView = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const trpc = useTRPC();

    const register = useMutation(trpc.auth.register.mutationOptions({
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess:async() => {
            await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
            router.push("/")
        }
    }));
    
    const form = useForm<z.infer<typeof registerSchema>>({
        mode:"all",
        resolver: zodResolver(registerSchema),
        defaultValues:{
            email:"",
            password:"",
            username:"",
        },
    });

    const onSubmit=(values:z.infer<typeof registerSchema>) => {
        register.mutate(values);
    }

    const username = form.watch("username");
    const usernamErrors = form.formState.errors.username;
    const showPreview = username && !usernamErrors;
    return (
        <div className="bg-[#F4F4F0] h-screen w-full lg:col-span-3 overflow-y-auto">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-8 p-4 lg:p-16"
                >
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/">
                            <span className={cn("text-2xl font-semibold", poppins.className)}>
                                marketplace
                            </span>
                        </Link>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-base border-none underline"
                        
                        >
                            <Link prefetch href="/sign-in">
                                Đăng nhập
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-4xl font-medium">
                        Cùng tham gia mua và bán tại đây
                    </h1>
                    <FormField
                        name="username"
                        render={({field})=>(
                            <FormItem>
                                <FormLabel className="text-base">Tên người dùng</FormLabel>
                                <FormControl>
                                    <Input {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    
                    />
                    <FormField
                        name="email"
                        render={({field})=>(
                            <FormItem>
                                <FormLabel className="text-base">Email</FormLabel>
                                <FormControl>
                                    <Input {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                            
                        )}
                    
                    />
                    <FormField
                        name="password"
                        render={({field})=>(
                            <FormItem>
                                <FormLabel className="text-base">Mật khẩu</FormLabel>
                                <FormControl>
                                    <Input {...field} type="password"/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                            
                        )}
                    
                    />
                    <Button 
                        disabled={register.isPending}
                        type="submit"
                        size="lg"
                        variant="elevated"
                        className="bg-black text-white hover:bg-white hover:text-primary"
                    
                    >
                        Tạo tài khoản
                    </Button>
                </form>
            </Form>
        </div>
    );
};