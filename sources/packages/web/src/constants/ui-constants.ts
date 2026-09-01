import { FormYesNoOptions, MenuItemModel, RadioItemType } from "@/types";

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
 * Item values to populate the Yes/No radio buttons.
 */
export const YES_NO_VALUES_RADIO_ITEMS: RadioItemType[] = [
  { title: "Yes", value: FormYesNoOptions.Yes },
  { title: "No", value: FormYesNoOptions.No },
];
