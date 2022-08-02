import sanitizeHtml from "sanitize-html";

export default {
  // Vue Hook Functions
  mounted(el, binding) {
    const { value } = binding;
    const options = {
      allowedTags: [
        // Headers
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        // Styles
        "b",
        "i",
        "em",
        "strong",
        "s",
        "sup",
        "sub",
        // Paragraph / Line-breaks
        "p",
        "br",
        "hr",
        // Link
        "a",
        // Image
        "img",
        // List
        "ol",
        "ul",
        "li",
        // Blockquote
        "blockquote",
        // Table
        "table",
        "tbody",
        "caption",
        "tr",
        "th",
        "td",
        // Misc
        "div",
        "span",
      ],
      allowedAttributes: {
        h1: ["id"],
        h2: ["id"],
        h3: ["id"],
        h4: ["id"],
        h5: ["id"],
        h6: ["id"],
        p: ["style"],
        a: ["href", "target"],
        img: ["src", "width", "height", "style"],
        div: ["id", "class", "style"],
      },
      allowedClasses: {
        "*": ["*"],
      },
    };
    el.innerHTML = sanitizeHtml(value, options);
  },
};
