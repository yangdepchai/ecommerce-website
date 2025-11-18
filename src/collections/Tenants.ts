import type { CollectionConfig } from "payload";

export const Tenants: CollectionConfig = {
    slug: "tenants",
    admin:{
        useAsTitle: "slug",
    },
    fields: [
        {
            name:"name",
            type:"text",
            required: true,
            label:"Tên cửa hàng",
            admin:{
                description:"Tên cửa hàng sẽ hiển thị trên giao diện người dùng" 
            },
        },

        {
            name:"slug",
            type:"text",
            index:true,
            required: true,
            unique:true,    
            admin:{
                description:"Tên miền phụ cho cửa hàng" 
            },
        },

        {
            name: "image",
            type: "upload",
            relationTo: "media",
        },        
        {
            name:"stripeAccountId", 
            type:"text",
            required:true,
            admin:{
                readOnly:true,
            },
        },
        {
            name:"stripeDetailsSubmitted", 
            type:"checkbox",
            admin:{
                readOnly:true,
                description:"Bạn không thể tạo sản phẩm cho đến khi bạn gửi chi tiết Stripe của mình."
            },
        },
        
    ],
};