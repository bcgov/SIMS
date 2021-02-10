import { mount } from "@vue/test-utils";
import store from "../../src/store";

// Target Vue
import ConfirmStudentAidBCProfileInfo from "../views/ConfirmStudentAidBCProfileInfo.vue";

describe("Test ConfirmStudentAidBCProfileInfo.vue", () => {
  beforeAll(() => {
    // store.dispatch("student/setStudentProfileData", {
    //   tokenParsed: {
    //     givenNames: "Test",
    //   }
    // });
  });
  afterAll(() => {});
  it("Should load ConfirmStudentAidBCProfileInfo Page with Some Readonly Information", () => {
    // const wrapper = mount(Home, {
    //   global: {
    //     plugins: [store],
    //     stubs: {
    //       Card: true,
    //       Button: true,
    //     },
    //   },
    //   shallow: true,
    // });
    // expect(wrapper.html()).toContain("Home - Student Dashboard");
    // expect(wrapper.s);
  });
});
