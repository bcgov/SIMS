// TODO: When all icon are replace to font awesome,
// replace  icon?: string | string[] with
// icon?:string[];
export interface MenuModel {
  label: string;
  icon?: string | string[];
  command?: () => void;
  items?: MenuModel[];
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  provinceState: string;
  country: string;
}
