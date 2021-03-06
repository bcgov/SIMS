import { mount } from "@vue/test-utils";
import store from "../../src/store";

// Target Vue
import StudentDashboard from "../../src/views/student/StudentDashboard.vue";

describe("Test StudentDashboard.vue", () => {
  beforeAll(() => {
    store.dispatch("student/setStudentProfileData", {
      tokenParsed: {
        givenNames: "Test",
      },
    });
  });
  it("should load home component", () => {
    const wrapper = mount(StudentDashboard, {
      global: {
        plugins: [store],
        stubs: {
          Card: true,
          Button: true,
        },
      },
      shallow: true,
    });
    expect(wrapper.html()).toContain("Student Dashboard");
  });
});
