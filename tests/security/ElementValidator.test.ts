// /tests/security/ElementValidator.test.ts
// RULE-ID: security-selector-validation

import { describe, it, expect } from "vitest";
import { ElementValidator } from "../../src/core/ElementValidator";
import { InvalidParameterError, InvalidConfigurationError } from "@david-osipov/security-kit";

describe("Security: ElementValidator", () => {
  let root: HTMLElement;
  let child: HTMLElement;
  let sibling: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
        <p id="child">I am inside.</p>
      </div>
      <div id="sibling">
        <p id="nephew">I am outside.</p>
      </div>
    `;
    root = document.getElementById("root")!;
    child = document.getElementById("child")!;
    sibling = document.getElementById("sibling")!;
  });

  it("should throw if initialized with a forbidden root like 'body'", () => {
    expect(() => new ElementValidator([document.body])).toThrow(InvalidConfigurationError);
  });

  describe("validateSelectorSyntax (static)", () => {
    it("should pass valid selectors", () => {
      expect(ElementValidator.validateSelectorSyntax("#id")).toBe("#id");
      expect(ElementValidator.validateSelectorSyntax(".class[attr=val]")).toBe(".class[attr=val]");
    });

    it("should throw InvalidParameterError for invalid selectors", () => {
      expect(() => ElementValidator.validateSelectorSyntax("")).toThrow(InvalidParameterError);
      expect(() => ElementValidator.validateSelectorSyntax("  ")).toThrow(InvalidParameterError);
      expect(() => ElementValidator.validateSelectorSyntax("#id[attr=")).toThrow(InvalidParameterError);
    });
  });

  describe("queryElementSafely (instance)", () => {
    const validator = new ElementValidator([root]);

    it("should find an element that is a child of the allowed root", () => {
      const found = validator.queryElementSafely("#child");
      expect(found).toBe(child);
    });

    it("should find the root element itself", () => {
      const found = validator.queryElementSafely("#root");
      expect(found).toBe(root);
    });

    it("should return null for a selector that targets an element outside the allowed root", () => {
      // This is the core sandbox test.
      const found = validator.queryElementSafely("#sibling");
      expect(found).toBe(null);
    });

    it("should return null for a selector targeting a descendant of a non-root element", () => {
      const found = validator.queryElementSafely("#nephew");
      expect(found).toBe(null);
    });

    it("should return null and log a warning for a valid selector that is outside the sandbox", () => {
      const validator = new ElementValidator([child]); // Sandbox is now the <p> tag
      const found = validator.queryElementSafely("#root");
      expect(found).toBe(null);
    });
  });
});
