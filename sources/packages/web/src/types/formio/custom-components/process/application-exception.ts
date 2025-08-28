export const APPLICATION_EXCEPTION = {
  title: "Exception",
  key: "applicationException",
  icon: "terminal",
  schema: {
    label: "nameOfTheExceptionGoesHereApplicationException",
    key: "nameOfTheExceptionGoesHereApplicationException",
    type: "container",
    input: true,
    components: [
      {
        label: "Exception Description - Description of the exception goes here",
        defaultValue: "exceptionDescription",
        calculateValue: 'value = "Description of the exception goes here";',
        calculateServer: true,
        key: "exceptionDescription",
        type: "hidden",
        input: true,
      },
    ],
  },
};

export const APPLICATION_EXCEPTION_FULL_SCHEMA = {
  title: "Exception - Full Schema",
  key: "applicationExceptionFullSchema",
  icon: "terminal",
  schema: {
    label: "nameOfTheExceptionGoesHereApplicationException",
    key: "nameOfTheExceptionGoesHereApplicationException",
    type: "container",
    components: [
      {
        label: "Exception Description - Description of the exception goes here",
        calculateValue: 'value = "Description of the exception goes here";',
        calculateServer: true,
        key: "exceptionDescription",
        type: "hidden",
      },
      {
        label: "HTML",
        attrs: [
          {
            attr: "",
            value: "",
          },
        ],
        content:
          '<h4 class="category-header-medium-small">Documents Accepted</h4>\n<ul>\n  <li>First document accepted<strong> or</strong></li>\n  <li>Second document accepted</li>\n</ul>',
        refreshOnChange: false,
        customClass: "align-bullets",
        key: "html31",
        type: "htmlelement",
        input: false,
        tableView: false,
      },
      {
        label: "HTML",
        attrs: [
          {
            attr: "",
            value: "",
          },
        ],
        content:
          '<h4 class="category-header-medium-small">Instructions:</h4>\n<ul>\n  <li>Upload a photo or scanned copy of your documentation</li>\n  <li>Rename your document to <br/>"<strong>Some_Instructions</strong>"</li>\n  (e.g. Some_Example)\n</ul>\n',
        refreshOnChange: false,
        customClass: "align-bullets",
        key: "html38",
        type: "htmlelement",
        input: false,
        tableView: false,
      },
      {
        label: "Upload exception documents",
        customClass: "font-weight-bold",
        hideLabel: true,
        storage: "url",
        dir: "Update to something meaningful to be saved to student files table.",
        filePattern: ".pdf,.doc,.docx,.jpg,.png,.txt",
        fileMaxSize: "15MB",
        multiple: true,
        validate: {
          required: true,
          customMessage:
            "You must upload at least one file, and the total number of uploaded files cannot exceed {{data.maxUploadedFiles}}.",
          custom:
            "const files = data[instance.key] || []; valid = files.length > data.maxUploadedFiles ? false : true;",
        },
        validateWhenHidden: false,
        type: "file",
        url: "student/files",
        input: true,
      },
      {
        label: "Columns",
        columns: [
          {
            components: [
              {
                html: "<p>We accept <strong>JPG, PNG, DOC, DOCX, PDF, TXT</strong></p>\n",
                label: "Content",
                type: "content",
              },
            ],
          },
          {
            components: [
              {
                html: '<p style="text-align:right;">15MB file limit each</p>\n',
                label: "Content",
                type: "content",
              },
            ],
          },
        ],
        type: "columns",
        input: false,
        hideLabel: true,
      },
    ],
  },
};
