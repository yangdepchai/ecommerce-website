import {  useQueryStates, parseAsArrayOf, parseAsString, parseAsStringLiteral } from "nuqs";

const sortValues = ["default","newest","oldest"] as const;

const params = {
    // 1. THÊM THAM SỐ TÌM KIẾM (QUAN TRỌNG)
    q: parseAsString
        .withOptions({
            clearOnDefault: true, // Tự xóa ?q= nếu rỗng
            shallow: false,       // false để trigger gọi lại API server (quan trọng cho search)
        })
        .withDefault(""),
    // ------------------------------------

    sort: parseAsStringLiteral(sortValues).withDefault("default"),
    
    minPrice: parseAsString 
        .withOptions({
            clearOnDefault:true,
        })
        .withDefault(""),
    
    maxPrice: parseAsString
        .withOptions({
            clearOnDefault:true,
        })
        .withDefault(""),
    
    tags: parseAsArrayOf(parseAsString)
        .withOptions({
            clearOnDefault:true,
        })
        .withDefault([]),
};

export const useProductFilters = () => {
    return useQueryStates(params);
};