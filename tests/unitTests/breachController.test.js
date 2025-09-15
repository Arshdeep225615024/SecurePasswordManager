const { expect } = require("chai");
const sinon = require("sinon");
const axios = require("axios");
const crypto = require("crypto");
const { checkBreach } = require("../../controllers/breachController");

describe("Breach Controller", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should detect breached password", async () => {
    const password = "password123";
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    // Mock response including the correct suffix
    sinon.stub(axios, "get").resolves({
      data: `${suffix}:5\nZZZZZZZZZZZZZZZZ:10`
    });

    const req = { body: { password } };
    let output;
    const res = { json: (obj) => (output = obj) };

    await checkBreach(req, res);
    expect(output.breached).to.be.true;
    expect(output.count).to.equal(5);
  });

  it("should return not breached for safe password", async () => {
    sinon.stub(axios, "get").resolves({ data: "XXXXXX:1\nYYYYYY:2" });

    const req = { body: { password: "anotherPass!" } };
    let output;
    const res = { json: (obj) => (output = obj) };

    await checkBreach(req, res);
    expect(output.breached).to.be.false;
    expect(output.count).to.equal(0);
  });
});
