import { mount } from "@vue/test-utils";
import store from "../../../../src/store";

// Target Vue
import ConfirmStudentAidBCProfileInfo from "../../../../src/components/fa-application/ConfirmStudentAidBCProfileInfo.vue";

describe("Test ConfirmStudentAidBCProfileInfo.vue", () => {
  it("Should load ConfirmStudentAidBCProfileInfo Page", () => {
    const wrapper = mount(ConfirmStudentAidBCProfileInfo, {
      global: {
        plugins: [store],
        stubs: ["globally-registered-component"],
      },
      shallow: true,
    });

    expect(wrapper.html()).toContain("Full Name");
  });
});
