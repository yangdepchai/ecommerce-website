import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
    slug: "products",
    fields: [
        {
            name:"name",
            type:"text",
            required: true,
        },
        {
            name:"description",
            type:"text",
        },
        {
            name:"price",
            type:"number",
            required:true,
            admin:{
                description:"VNĐ"
            }
        },
        {
            name:"category",
            type:"relationship",
            relationTo:"categories",
            hasMany: false,
        },
        {
            name:"tags",
            type:"relationship",
            relationTo:"tags",
            hasMany: true,
        },
        {
            name: "image",
            type: "upload",
            relationTo: "media",
        },
        {
            name:"refundPolicy",
            type:"select",
            options:["30 ngày","14 ngày","7 ngày","3 ngày","1 ngày","không hoàn tiền"],
            defaultValue:"30 ngày",
        }
    ],
};