export const FORMIO_CUSTOM_COMPONENTS = {
  title: "SIMS",
  components: {
    h2Header: {
      title: "Header - Large",
      key: "largeHeader",
      icon: "terminal",
      schema: {
        label: "HTML",
        tag: "h2",
        className: "category-header-large primary-color",
        content: "Some Header Large Content",
        type: "htmlelement",
        input: false,
      },
    },
    h3Header: {
      title: "Header - Medium",
      key: "mediumHeader",
      icon: "terminal",
      schema: {
        label: "HTML",
        tag: "h3",
        className: "category-header-medium primary-color",
        content: "Some Header Medium Content",
        type: "htmlelement",
        input: false,
      },
    },
    applicationException: {
      title: "Exception",
      key: "applicationException",
      icon: "terminal",
      schema: {
        label: "Provide Some Name - Application Exception",
        type: "hidden",
        key: "provideSomeNameApplicationException",
        input: true,
      },
    },
  },
};
