const request = require("supertest");
const { expect } = require("chai");
const express = require("express");
const sinon = require("sinon");
const axios = require("axios");
const crypto = require("crypto");
const breachRoutes = require("../../routes/breachRoutes");

const app = express();
app.use(express.json());
app.use("/api", breachRoutes);

describe("Breach Routes", () => {
  afterEach(() => sinon.restore());

  it("POST /api/check-breach should return breached=true when suffix found", async () => {
    const password = "password123";
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    sinon.stub(axios, "get").resolves({ data: `${suffix}:100` });

    const res = await request(app)
      .post("/api/check-breach")
      .send({ password });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("breached", true);
    expect(res.body.count).to.equal(100);
  });
});