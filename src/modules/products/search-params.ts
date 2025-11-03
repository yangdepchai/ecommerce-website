import { createLoader,parseAsArrayOf,parseAsString, parseAsStringLiteral } from "nuqs/server";

export const sortValues = ["default","newest","oldest"] as const;

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

export const loadProductFilters = createLoader(params);