import { mount, shallowMount } from "@vue/test-utils";
import StringToHtmlParagraphs from "../../../src/components/generic/StringToHtmlParagraphs.vue";

describe("StringToHtmlParagraphs.vue", () => {
  it("should add two html paragraphs when the text has one line break", () => {
    // Arrange
    const text = "Paragraph_A\nParagraph_b";
    // Act
    const wrapper = shallowMount(StringToHtmlParagraphs, {
      props: { text },
    });
    // Assert
    expect(wrapper.html()).toMatch(
      "<div><p>Paragraph_A</p></div><div><p>Paragraph_b</p></div>",
    );
  });

  it("should add one html paragraph when the text does not have any line break", () => {
    // Arrange
    const text = "Paragraph_A";
    // Act
    const wrapper = shallowMount(StringToHtmlParagraphs, {
      props: { text },
    });
    // Assert
    expect(wrapper.html()).toMatch("<div><p>Paragraph_A</p></div>");
  });

  it("should not render the component when the text is undefined", () => {
    // Arrange
    const text = undefined;
    // Act
    const wrapper = mount(StringToHtmlParagraphs, {
      props: { text },
    });
    // Assert
    expect(wrapper.html()).toMatch("");
  });
});
