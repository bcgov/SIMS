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
  provinceState?: string;
  country: string;
}

export interface AddressInfo {
  addressLine1: string;
  addressLine2?: string;
  provinceState?: string;
  country: string;
  city: string;
  postalCode: string;
  selectedCountry?: string;
}

/**
 * Layout template types for page container components.
 */
export enum LayoutTemplates {
  /**
   * Create a the default slot without v-card wrapped to it.
   */
  Centered = "centered",
  /**
   * Create a the default slot inside v-card.
   */
  CenteredCard = "centered-card",
  /**
   * Create view to start from the start without center to match with figma.
   */
  Start = "start",
  /**
   * Create view to adapt view with tabs.
   ** i.e create the tab header outside v-card and tab-window inside v-card.
   */
  CenteredTab = "centered-tab",
}
