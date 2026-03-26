import { describe, it, expect } from "bun:test";
import { parseChmod } from "./chmod";

describe("parseChmod", () => {
  it("returns error for unrecognized input", () => {
    const result = parseChmod("invalid");
    expect(result.valid).toBe(false);
  });

  it("returns error for empty input", () => {
    const result = parseChmod("");
    expect(result.valid).toBe(false);
  });

  it("parses octal 755", () => {
    const result = parseChmod("755");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.octal).toBe("755");
    expect(result.symbolic).toBe("rwxr-xr-x");
    expect(result.owner.read).toBe(true);
    expect(result.owner.write).toBe(true);
    expect(result.owner.execute).toBe(true);
    expect(result.group.read).toBe(true);
    expect(result.group.write).toBe(false);
    expect(result.group.execute).toBe(true);
    expect(result.other.read).toBe(true);
    expect(result.other.write).toBe(false);
    expect(result.other.execute).toBe(true);
    expect(result.commonName).toBe("Standard directory / executable");
  });

  it("parses octal 644", () => {
    const result = parseChmod("644");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.symbolic).toBe("rw-r--r--");
    expect(result.owner.write).toBe(true);
    expect(result.group.write).toBe(false);
    expect(result.other.write).toBe(false);
    expect(result.commonName).toBe("Standard file");
  });

  it("parses octal 600 (private file)", () => {
    const result = parseChmod("600");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.symbolic).toBe("rw-------");
    expect(result.group.read).toBe(false);
    expect(result.other.read).toBe(false);
  });

  it("parses octal 777 (world-writable)", () => {
    const result = parseChmod("777");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.symbolic).toBe("rwxrwxrwx");
    expect(result.commonName).toBe("World-writable");
  });

  it("parses leading-zero octal (0755)", () => {
    const result = parseChmod("0755");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.octal).toBe("755");
  });

  it("strips 'chmod ' prefix", () => {
    const result = parseChmod("chmod 755 myfile");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.octal).toBe("755");
  });

  it("parses ls symbolic format -rwxr-xr-x", () => {
    const result = parseChmod("-rwxr-xr-x");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.octal).toBe("755");
    expect(result.symbolic).toBe("rwxr-xr-x");
  });

  it("parses ls symbolic format rw-r--r--", () => {
    const result = parseChmod("rw-r--r--");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.octal).toBe("644");
  });

  it("returns useCases for known permissions", () => {
    const result = parseChmod("600");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.useCases.length).toBeGreaterThan(0);
  });

  it("returns empty useCases for unknown permissions", () => {
    const result = parseChmod("123");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.useCases).toEqual([]);
  });

  it("summary describes permissions in plain English", () => {
    const result = parseChmod("755");
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.summary.toLowerCase()).toContain("owner");
    expect(result.summary.toLowerCase()).toContain("group");
  });
});
