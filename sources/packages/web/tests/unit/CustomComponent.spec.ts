import { shallowMount } from "@vue/test-utils";
import InputTextComponent from "../components/InputTextComponent.vue";
import HelloWorld from "../components/HelloWorld.vue";

describe("HelloWorld.vue", () => {
  it("renders props.msg when passed", () => {
    const msg = "new message";
    const wrapper = shallowMount(HelloWorld, {
      props: { msg },
    });
    expect(wrapper.text()).toMatch(msg);
  });
});

describe("Inline Component Test", () => {
  it("Inline Component Test", () => {
    const TestComponent = { template: '<div><p id="some.id" /></div>' };
    const wrapper = shallowMount(TestComponent);
    expect(wrapper.find("#some\\.id").exists()).toEqual(true);
  });
});

describe("InputTextComponent Test", () => {
  it("check if accurate fields are renderered on the student page", () => {
    const wrapper = shallowMount(InputTextComponent, {
      props: {
        id: "firstName",
        label: "Given Names",
        value: "Test User",
      },
    });

    console.log(wrapper.find("#firstName").exists());
    console.log(wrapper.html());
    expect(wrapper.find("#firstName").exists()).toEqual(true);
  });
});
