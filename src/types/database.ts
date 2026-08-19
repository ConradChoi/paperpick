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

export type OptionType = "display" | "variant";

export type OptionGroup = {
  id: string;
  name_ko: string;
  name_en: string | null;
  type: OptionType;
  sort_order: number;
  created_at: string;
};

export type OptionValue = {
  id: string;
  option_group_id: string;
  value_ko: string;
  value_en: string | null;
  price_delta: number;
  sort_order: number;
  created_at: string;
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
