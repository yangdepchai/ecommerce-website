import type { CollectionConfig, Access, FieldAccess } from "payload";
import type { User, Tenant } from "../payload-types";

interface TypeSafeUser extends User {
  tenants?: Array<{
    tenant: string | Tenant;
    roles: string[];
  }>;
}

// 1. ACCESS CẤP COLLECTION (Dùng cho update/delete collection)
// Không dùng 'doc', mà trả về Query lọc ID
const canManageTenant: Access = ({ req: { user } }) => {
  const currentUser = user as unknown as TypeSafeUser;

  if (!currentUser) return false;
  if (currentUser.roles?.includes("super-admin")) return true;

  // Lấy danh sách ID các Tenant mà user sở hữu
  const myTenantIds =
    currentUser.tenants?.map((t) =>
      typeof t.tenant === "object" ? t.tenant.id : t.tenant
    ) || [];

  // Trả về câu Query: "Chỉ cho phép nếu ID của Tenant nằm trong danh sách myTenantIds"
  return {
    id: {
      in: myTenantIds,
    },
  };
};

// 2. ACCESS CẤP FIELD (Dùng cho ẩn hiện field API Key)
// Có thể dùng 'doc' ở đây
const canReadSensitiveField: FieldAccess = ({ req: { user }, doc }) => {
  const currentUser = user as unknown as TypeSafeUser;

  if (!currentUser) return false;
  if (currentUser.roles?.includes("super-admin")) return true;

  // Nếu chưa có doc (lúc đang tạo mới) -> chặn xem
  if (!doc) return false;

  const tenantDoc = doc as Tenant; // Ép kiểu doc hiện tại thành Tenant

  // Check xem ID của Tenant hiện tại có nằm trong list của user không
  return (
    currentUser.tenants?.some((t) => {
      const tId = typeof t.tenant === "object" ? t.tenant.id : t.tenant;
      return tId === tenantDoc.id;
    }) || false
  );
};

export const Tenants: CollectionConfig = {
  slug: "tenants",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "payosClientId"],
  },
  access: {
    read: () => true, // Public xem được info cơ bản
    update: canManageTenant, // Dùng hàm Access trả về Query
    delete: canManageTenant, // Dùng hàm Access trả về Query
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Tên cửa hàng",
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
      admin: {
        description: "URL của cửa hàng (VD: shop-quan-ao)",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    // --- CẤU HÌNH PAYOS ---
    {
      name: 'payosClientId',
      label: 'PayOS Client ID',
      type: 'text',
      required: false, // Đã sửa thành false từ bước trước
      access: {
        // Cho phép đọc nếu đã đăng nhập (để đơn giản)
        // Hoặc logic phức tạp hơn: chỉ admin hoặc chủ sở hữu mới được xem
        read: ({ req }) => !!req.user, 
      },
    },
    {
      name: 'payosApiKey',
      label: 'PayOS API Key',
      type: 'text',
      required: false,
      access: {
        read: ({ req }) => !!req.user,
      },
    },
    {
      name: 'payosChecksumKey',
      label: 'PayOS Checksum Key',
      type: 'text',
      required: false,
      access: {
        read: ({ req }) => !!req.user,
      },
    },
  ],
};