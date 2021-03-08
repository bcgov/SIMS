import { mount } from "@vue/test-utils";
import Section from "../../../../src/components/generic/Section.vue";

const sectionTitleSelector = "#sectionTitle";

describe("Section.vue", () => {
  it("Should change title style class accordingly to section type", async () => {
    const wrapper = mount(Section);
    // Default style should be 'primary'.
    expect(wrapper.find(sectionTitleSelector).classes()).toContain(
      "fa-section-header",
    );

    await wrapper.setProps({ type: "secondary" });
    expect(wrapper.find(sectionTitleSelector).classes()).toContain(
      "fa-section-header-secondary",
    );

    await wrapper.setProps({ type: "additional" });
    expect(wrapper.find(sectionTitleSelector).classes()).toContain(
      "fa-section-header-additional",
    );

    await wrapper.setProps({ type: "primary" });
    expect(wrapper.find(sectionTitleSelector).classes()).toContain(
      "fa-section-header",
    );
  });
});
