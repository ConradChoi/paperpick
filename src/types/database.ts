export type ProductSize = "A4" | "A3" | "B4" | "B5";
export type ProductStatus = "active" | "soldout";

export type Product = {
  id: string;
  brand_ko: string;
  brand_en: string | null;
  name_ko: string;
  name_en: string | null;
  size: ProductSize;
  weight_gsm: number;
  unit_ko: string;
  unit_en: string | null;
  price: number;
  price_visible: boolean;
  description_ko: string | null;
  description_en: string | null;
  image_url: string | null;
  additional_image_urls: string[];
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

export type AdminMenu = "products" | "inquiries";
export type PermissionAction = "create" | "read" | "update" | "delete";
export type AdminStatus = "pending" | "approved" | "rejected";

export type AdminRow = {
  user_id: string;
  email: string | null;
  is_super_admin: boolean;
  group_id: string | null;
  status: AdminStatus;
  created_at: string;
};

export type OperatorGroup = {
  id: string;
  name: string;
  created_at: string;
};

export type OperatorGroupPermission = {
  group_id: string;
  menu: AdminMenu;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

export type InquiryType = "general" | "reservation" | "newsletter";
export type InquiryStatus = "new" | "in_progress" | "done";
export type Locale = "ko" | "en";

export type Inquiry = {
  id: string;
  type: InquiryType;
  name: string;
  contact: string;
  message: string | null;
  product_id: string | null;
  locale: Locale;
  status: InquiryStatus;
  consent_at: string;
  consent_version: string;
  created_at: string;
};
