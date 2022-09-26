export default class CommonRegex {
  dateTimeRegex = new RegExp("\\d{4}-\\d{2}-\\d{2}");
  timeStampRegex = new RegExp(
    "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z"
  );
  phoneNumberRegex = new RegExp("\\d{10,20}");
  emailRegex = new RegExp("\\S*@[a-zA-Z0-9]{2,}.[a-zA-Z]{2,}");
}
