/// <reference types="vite/client" />

declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}
// Form.io style declarations
declare module "@formio/js/dist/formio.full.css" {
  const content: any;
  export default content;
}

declare module "@formio/js" {
  const Formio: any;
  export default Formio;
}
