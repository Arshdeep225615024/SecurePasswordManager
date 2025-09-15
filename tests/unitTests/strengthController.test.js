const { expect } = require("chai");
const { checkStrength } = require("../../controllers/strengthController");

describe("Password Strength Controller", () => {
  it("should return Weak for short/simple password", () => {
    const req = { body: { password: "123" } };
    let output;
    const res = { 
      status: (code) => ({ json: (obj) => (output = { code, ...obj }) }),
      json: (obj) => (output = obj)
    };

    checkStrength(req, res);
    expect(output.strength).to.equal("Weak");
  });

  it("should return Very Strong for complex password", () => {
    const req = { body: { password: "Str0ng@Pass!" } };
    let output;
    const res = { json: (obj) => (output = obj) };

    checkStrength(req, res);
    expect(output.strength).to.equal("Very Strong");
  });
});