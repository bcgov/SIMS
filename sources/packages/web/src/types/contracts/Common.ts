import { RouteLocationRaw } from "vue-router";

/**
 * @deprecated Use MenuItemModel and once MenuModel removed from all delete the MenuModel.
 */
export interface MenuModel {
  label: string;
  icon?: string | string[];
  command?: () => void;
  items?: MenuModel[];
}

/**
 *  Interface for Menu.
 */
export interface MenuItemModel {
  title?: string;
  props?: {
    subtitle?: string;
    class?: string;
    prependIcon?: string;
    to?: RouteLocationRaw;
    slim?: boolean;
    color?: string | null;
    opacity?: number;
  };
  type?: string;
  children?: MenuItemModel[];
  command?: () => void;
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
   * Create view with no card tabs.
   */
  CenteredTab = "centered-tab",
  /**
   * Create view to adapt view with tabs.
   ** i.e create the tab header outside v-card and tab-window inside v-card.
   */
  CenteredCardTab = "centered-card-tab",
}
