import { mount } from "@vue/test-utils";
import store from "../../src/store";
import formio from "@/components/generic/formio.vue";
import ProgressSpinner from "primevue/progressspinner/ProgressSpinner";

// Target Vue
import StudentDashboard from "../../src/views/student/StudentDashboard.vue";

/**
 * Student dashboard test expecting the form name in html
 */
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
        components: {
          ProgressSpinner,
          formio,
        },
      },
    });
  });
});
