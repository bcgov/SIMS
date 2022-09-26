export default class CommonRegex {
  dateTimeRegex = /\d{4}-\d{2}-\d{2}/;
  timeStampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
  phoneNumberRegex = /\d{10,20}/;
  emailRegex = /\S*@[a-zA-Z0-9]{2,}.[a-zA-Z]{2,}/;
}
