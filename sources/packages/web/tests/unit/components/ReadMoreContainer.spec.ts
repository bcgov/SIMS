import { mount } from "@vue/test-utils";
import ReadMoreContainer from "../../../src/components/generic/ReadMoreContainer.vue";

const extendedContentSelector = "#extendedContent";
const toggleButtonSelector = "#toggleButton";

describe("ReadMoreContainer.vue", () => {
  it("Should not display expanded text on initial state", () => {
    // Arrange
    const collapsedText = "Collapsed Text";
    // Act
    const wrapper = mount(ReadMoreContainer, {
      props: { collapsedText },
    });
    // Assert
    expect(wrapper.find(extendedContentSelector).isVisible()).toBe(false);
    expect(wrapper.find(toggleButtonSelector).text()).toBe(collapsedText);
  });

  it("Should display expanded content when 'Read More' is clicked", async () => {
    // Arrange
    const expandedText = "Expanded Text";
    // Act
    const wrapper = mount(ReadMoreContainer, {
      props: { expandedText },
    });
    await wrapper.find(toggleButtonSelector).trigger("click");
    // Assert
    expect(wrapper.find(extendedContentSelector).isVisible()).toBe(true);
    expect(wrapper.find(toggleButtonSelector).text()).toBe(expandedText);
  });

  it("Should return to initial state if toggle button is clicked twice", async () => {
    // Arrange
    const collapsedText = "Collapsed Text";
    // Act
    // Act
    const wrapper = mount(ReadMoreContainer, {
      props: { collapsedText },
    });
    const toggleButton = wrapper.find(toggleButtonSelector);
    await toggleButton.trigger("click");
    await toggleButton.trigger("click");
    // Assert
    expect(wrapper.find(extendedContentSelector).isVisible()).toBe(false);
    expect(wrapper.find(toggleButtonSelector).text()).toBe(collapsedText);
  });
});
