import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
    slug: "products",
    fields: [
        {
            name: "name",
            type: "text",
            label: "Tên sản phẩm",
            required: true,
        },
        {
            name: "description",
            type: "text",
            label: "Mô tả",
        },
        {
            name: "price",
            type: "number",
            label: "Giá",
            required: true,
            admin: {
                description: "VNĐ"
            }
        },
        {
            name: "category",
            type: "relationship",
            label: "Danh mục",
            relationTo: "categories",
            hasMany: false,
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'isInfiniteStock',
                    label: 'Kho hàng vô hạn (Ebook/Soft)',
                    type: 'checkbox',
                    defaultValue: true, // Mặc định là vô hạn cho dễ
                },
                {
                    name: 'stock',
                    label: 'Số lượng (Nếu không vô hạn)',
                    type: 'number',
                    defaultValue: 1, // Mặc định 1 cho acc game
                    admin: {
                        // Chỉ hiện ô nhập số lượng nếu KHÔNG TÍCH vô hạn
                        condition: (data) => !data.isInfiniteStock,
                    },
                },
            ],
        },
        {
            name: "tags",
            type: "relationship",
            relationTo: "tags",
            hasMany: true,
        },
        {
            name: "image",
            type: "upload",
            label: "Ảnh sản phẩm",
            relationTo: "media",
        },
        {
            type: 'row', // Gom 2 trường này nằm cùng 1 hàng cho đẹp
            fields: [
                {
                    name: 'productType',
                    label: 'Loại sản phẩm',
                    type: 'select',
                    defaultValue: 'text',
                    options: [
                        { label: 'Key / Tài khoản / Text', value: 'text' },
                        { label: 'File tải về (Zip/PDF)', value: 'file' },
                    ],
                    required: true,
                },
            ]
        },
        {
            name: 'payloadText',
            label: 'Nội dung bàn giao (Key/Account)',
            type: 'textarea',
            admin: {
                condition: (data) => data.productType === 'text',
            },
            // --- SỬA ĐOẠN ACCESS NÀY ---
            access: {
                // Chỉ cho phép đọc nếu ĐÃ ĐĂNG NHẬP (tức là Admin)
                read: ({ req }) => !!req.user,
            },
        },
        {
            name: 'payloadFile',
            label: 'File bàn giao',
            type: 'upload',
            relationTo: 'media',
            admin: {
                condition: (data) => data.productType === 'file',
            },
            // --- SỬA ĐOẠN ACCESS NÀY ---
            access: {
                // Chỉ cho phép đọc nếu ĐÃ ĐĂNG NHẬP (tức là Admin)
                read: ({ req }) => !!req.user,
            },
        },
        {
            name: 'reviewCount',
            label: 'Số lượng đánh giá',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true }, // Chỉ để hệ thống tự update
        },
        {
            name: 'rating',
            label: 'Điểm đánh giá TB',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true },
        },
        {
            name: 'starCounts',
            label: 'Chi tiết số sao',
            type: 'json', // Lưu dạng { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            defaultValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            admin: { readOnly: true },
        },
    ],
};