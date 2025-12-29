import type { CollectionConfig, Access } from "payload";
import type { Where } from "payload"; // <--- 1. Import thêm Where
import type { User, Tenant } from "../payload-types";

// Interface để TypeScript hiểu cấu trúc User của bạn
interface TypeSafeUser extends User {
  tenants?: Array<{
    tenant: string | Tenant;
    roles: string[];
  }>;
}

// --- ACCESS CONTROL ---

const yourOwnOrTenantOrders: Access = ({ req: { user } }) => {
  const currentUser = user as unknown as TypeSafeUser;

  if (!currentUser) return false;
  if (currentUser.roles?.includes("super-admin")) return true;

  // Nếu là chủ shop
  if (currentUser.tenants && currentUser.tenants.length > 0) {
    const tenantIds = currentUser.tenants.map((t) =>
      typeof t.tenant === "object" ? t.tenant.id : t.tenant
    );

    // 2. Ép kiểu 'as Where' để TypeScript không báo lỗi cấu trúc mảng 'or'
    return {
      or: [
        {
          tenant: {
            in: tenantIds,
          },
        },
        {
          orderedBy: {
            equals: currentUser.id,
          },
        },
      ],
    } as Where;
  }

  // Khách thường
  return {
    orderedBy: {
      equals: currentUser.id,
    },
  };
};

const isLoggedIn: Access = ({ req: { user } }) => {
  return Boolean(user);
};

const tenantAdminsOnly: Access = ({ req: { user } }) => {
  const currentUser = user as unknown as TypeSafeUser;
  if (!currentUser) return false;
  if (currentUser.roles?.includes("super-admin")) return true;

  if (currentUser.tenants && currentUser.tenants.length > 0) {
    const tenantIds = currentUser.tenants.map((t) =>
      typeof t.tenant === "object" ? t.tenant.id : t.tenant
    );
    return {
      tenant: { in: tenantIds },
    };
  }

  return false;
};

// --- COLLECTION CONFIG ---

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["createdAt", "status", "total", "tenant"],
  },
  access: {
    read: yourOwnOrTenantOrders,
    create: isLoggedIn,
    update: tenantAdminsOnly,
    delete: ({ req: { user } }) => user?.roles?.includes("super-admin") || false,
  },
  fields: [
    {
      name: "tenant",
      type: "relationship",
      label: "Cửa hàng",
      relationTo: "tenants",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "orderedBy",
      type: "relationship",
      label: "Người đặt hàng",
      relationTo: "users",
      required: true,
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === "create") {
              // Bảo vệ: Nếu user chưa login mà cố tạo đơn (trường hợp lỏng lẻo)
              if (req.user) return req.user.id;
            }
            return value;
          },
        ],
      },
    },
    {
      name: "items",
      type: "array",
      label: "Các mặt hàng",
      required: true,
      fields: [
        {
          name: "product",
          label: "Sản phẩm",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "quantity",
          label: "Số lượng",
          type: "number",
          min: 1,
          required: true,
        },
        {
          name: "price",
          type: "number",
          label: "Giá tại thời điểm đặt hàng",
          required: true,
        },
      ],
    },
    {
      name: "total",
      label: "Tổng tiền",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "status",
      type: "select",
      label: "Trạng thái đơn hàng",
      options: [
        { label: "Chờ thanh toán", value: "pending" },
        { label: "Đã thanh toán", value: "paid" },
        { label: "Đã hủy", value: "cancelled" },
      ],
      defaultValue: "pending",
      required: true,
    },
    // --- PAYOS FIELDS ---
    {
      name: "payosOrderCode",
      type: "number",
      index: true,
      admin: {
        readOnly: true,
        description: "Mã đơn hàng số nguyên dùng riêng cho PayOS",
      },
      hooks: {
        beforeChange: [
          ({ operation, value }) => {
            // Tự động sinh mã số nguyên khi tạo đơn
            if (operation === "create") {
              // Lấy timestamp + random nhỏ để giảm tỉ lệ trùng lặp
              // PayOS yêu cầu: Số nguyên dương, nhỏ hơn 9007199254740991
              return Number(Date.now().toString().slice(-9) + Math.floor(Math.random() * 10));
            }
            return value;
          },
        ],
      },
    },
    {
      name: "paymentId",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],
};