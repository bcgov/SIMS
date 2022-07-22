import mitt from "mitt";
const emitter = mitt();

export default function useEmitter() {
  return emitter;
}
