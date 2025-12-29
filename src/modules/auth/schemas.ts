import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});


export const registerSchema = z.object({
    email: z.string().email("Định dạng email không đúng"),
    password: z.string().min(3, "Mật khẩu phải có ít nhất 3 kí tự"),
    username: z
        .string()
        .min(3, "Tên người dùng phải có ít nhất 3 kí tự")
        .max(36, "Tên người dùng chỉ được tối đa 36 kí tự")
        .regex(
            /^[a-z0-9][a-z0-9-]{1,34}[a-z0-9]$/,
            "Tên người dùng chỉ được chứa chữ cái in thường, không dấu; số và dấu gạch nối.Nó phải bắt đầu và kết thúc với 1 chữ cái hoặc 1 chữ số"
        )
        .refine(
            (val) => !val.includes("--"),
            "Tên người dùng không được chứa 2 gạch nối liền nhau"
        )
        .transform((val) => val.toLowerCase()),
    payosClientId: z.string().optional(),
    payosApiKey: z.string().optional(),
    payosChecksumKey: z.string().optional(),
})