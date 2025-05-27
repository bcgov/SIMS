export const CURRENCY = {
  title: "Number - Currency",
  icon: "money",
  schema: {
    label: "Currency",
    prefix: "$",
    applyMaskOn: "change",
    mask: false,
    tableView: false,
    delimiter: true,
    requireDecimal: false,
    inputFormat: "plain",
    truncateMultipleSpaces: false,
    validate: {
      required: true,
      custom:
        "valid = (input >= 0 && input < data.maxIncome) ? true : 'The number you have entered is outside the expected range.';",
    },
    type: "number",
    decimalLimit: 0,
    input: true,
  },
};
