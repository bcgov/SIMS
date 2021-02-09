import { mount, config } from "@vue/test-utils";
import store from "../../src/store";

// Target Vue
import Home from "../../src/views/Home.vue";


describe('Test Home.vue', () => {
  beforeAll(() => {
    store.dispatch("student/setStudentProfileData", {
      tokenParsed: {
        givenNames: "Test",
      }
    });
  });
  afterAll(() => {
  });
  it("should load home component", () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [store],
        stubs: {
          Card: true,
          Button: true
        },
      },
      shallow: true
    });
    expect(wrapper.html()).toContain("Home - Student Dashboard");
    expect(wrapper.s)
  });
});