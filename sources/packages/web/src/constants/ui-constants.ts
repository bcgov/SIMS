import { FormYesNoOptions, MenuItemModel, ComponentItemType } from "@/types";

/**
 * Basic divider for the menu sections.
 */
export const DIVIDER_MENU_ITEM: MenuItemModel = {
  type: "divider",
  props: {
    class: "mx-2",
  },
};

/**
 * Item values to populate the Yes/No options.
 */
export const YES_NO_VALUE_ITEMS: ComponentItemType[] = [
  { title: "Yes", value: FormYesNoOptions.Yes },
  { title: "No", value: FormYesNoOptions.No },
];
