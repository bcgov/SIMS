import { mount } from "@vue/test-utils";
import store from "../../src/store";

// Target Vue
import InstituteList from "../../src/components/partial-view/student/financial-aid-application/InstituteList.vue";

describe("Test InstituteList.vue", () => {
  it("should load institute component", () => {
    const wrapper = mount(InstituteList, {
      global: {
        plugins: [store],
        stubs: ["globally-registered-component"],
      },
      shallow: true,
    });
    expect(wrapper.html()).toContain("Search for your school");
  });
});
