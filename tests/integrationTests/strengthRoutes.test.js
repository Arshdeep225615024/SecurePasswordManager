const request = require("supertest");
const { expect } = require("chai");
const express = require("express");
const strengthRoutes = require("../../routes/strengthRoutes");

const app = express();
app.use(express.json());
app.use("/api", strengthRoutes);

describe("Strength Routes", () => {
  it("POST /api/check-strength should return strength result", async () => {
    const res = await request(app)
      .post("/api/check-strength")
      .send({ password: "Test123!" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("strength");
    expect(res.body).to.have.property("score");
  });
});