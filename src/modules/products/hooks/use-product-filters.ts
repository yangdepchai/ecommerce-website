import {  useQueryStates, parseAsArrayOf, parseAsString, parseAsStringLiteral } from "nuqs";

const sortValues = ["default","newest","oldest"] as const;
const params = {
    sort:parseAsStringLiteral(sortValues).withDefault("default"),
    minPrice:parseAsString 
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
