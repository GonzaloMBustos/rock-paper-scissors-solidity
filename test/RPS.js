const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("RPS Contract", function () {
  async function deployRPSFixture() {
    const RPS = await ethers.getContractFactory("RPS");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hhRPS = await RPS.deploy(1, 5);
    await hhRPS.deployed();

    return { RPS, hhRPS, owner, addr1, addr2 };
  }

  async function challengeSuccessfulFixture() {
    const RPS = await ethers.getContractFactory("RPS");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hhRPS = await RPS.deploy(1, 5);
    await hhRPS.deployed();

    await hhRPS.challenge(addr1.address);
    await hhRPS.connect(addr1).acceptChallenge(owner.address);

    return { RPS, hhRPS, owner, addr1, addr2 };
  }

  async function commitSuccessfulFixture() {
    const RPS = await ethers.getContractFactory("RPS");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hhRPS = await RPS.deploy(1, 5);
    await hhRPS.deployed();

    await hhRPS.challenge(addr1.address);
    await hhRPS.connect(addr1).acceptChallenge(owner.address);

    let hash = await hhRPS.hashPacked(owner.address, 2);
    await hhRPS.commit(hash, { value: 2 });
    hash = await hhRPS.hashPacked(addr1.address, 2);
    await hhRPS.connect(addr1).commit(hash, { value: 2 });

    return { RPS, hhRPS, owner, addr1, addr2 };
  }

  async function revealSuccessfulFixture() {
    const RPS = await ethers.getContractFactory("RPS");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hhRPS = await RPS.deploy(1, 5);
    await hhRPS.deployed();

    await hhRPS.challenge(addr1.address);
    await hhRPS.connect(addr1).acceptChallenge(owner.address);

    let hash = await hhRPS.hashPacked(owner.address, 2);
    await hhRPS.commit(hash, { value: 2 });
    hash = await hhRPS.hashPacked(addr1.address, 1);
    await hhRPS.connect(addr1).commit(hash, { value: 2 });

    await hhRPS.reveal(2);
    await hhRPS.connect(addr1).reveal(1);

    return { RPS, hhRPS, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set bet and revealSpan", async function () {
      const { hhRPS } = await loadFixture(deployRPSFixture);

      expect(await hhRPS.bet()).to.equal(1);
      expect(await hhRPS.revealSpan()).to.equal(5);
    });
  });

  describe("Challenging", function () {
    it("Should challenge opponent correctly", async function () {
      const { hhRPS, owner, addr1 } = await loadFixture(deployRPSFixture);
      await hhRPS.challenge(addr1.address);
      expect(await hhRPS.challengedPlayers(addr1.address)).to.equal(
        owner.address
      );
    });

    it("Should accept challenge correctly", async function () {
      const { hhRPS, owner, addr1 } = await loadFixture(deployRPSFixture);
      await hhRPS.challenge(addr1.address);
      await hhRPS.connect(addr1).acceptChallenge(owner.address);
      expect(await hhRPS.challengedPlayers(owner.address)).to.equal(
        addr1.address
      );
    });

    it("Should reject challenge correctly", async function () {
      const { hhRPS, owner, addr1 } = await loadFixture(deployRPSFixture);
      await hhRPS.challenge(addr1.address);
      await hhRPS.connect(addr1).rejectChallenge();
      expect(await hhRPS.challengedPlayers(owner.address)).to.equal(
        ethers.constants.AddressZero
      );
      expect(await hhRPS.challengedPlayers(addr1.address)).to.equal(
        ethers.constants.AddressZero
      );
    });
  });

  describe("Commitment", function () {
    it("Should revert due to player not challenged", async function () {
      const { hhRPS, owner } = await loadFixture(deployRPSFixture);

      const hash = await hhRPS.hashPacked(owner.address, 2);
      await expect(hhRPS.commit(hash, { value: 2 })).to.be.reverted;
    });

    it("Should revert due to insufficient bet", async function () {
      const { hhRPS, owner } = await loadFixture(deployRPSFixture);

      const hash = await hhRPS.hashPacked(owner.address, 2);
      await expect(hhRPS.commit(hash, { value: 0 })).to.be.reverted;
    });

    it("Should commit first successfully", async function () {
      const { hhRPS, owner } = await loadFixture(challengeSuccessfulFixture);

      const hash = await hhRPS.hashPacked(owner.address, 2);
      expect(await hhRPS.stage()).to.equal(0);
      await hhRPS.commit(hash, { value: 2 });
      expect(await hhRPS.stage()).to.equal(1);
      const commit = await hhRPS.players(0);
      expect(commit.playerAddress).to.equal(owner.address);
      expect(commit.commitment).to.equal(hash);
      expect(commit.choice).to.equal(0);
      expect(commit.playerBet).to.equal(2);
    });

    it("Should commit second successfully", async function () {
      const { hhRPS, owner, addr1 } = await loadFixture(
        challengeSuccessfulFixture
      );

      let hash = await hhRPS.hashPacked(owner.address, 2);
      expect(await hhRPS.stage()).to.equal(0);
      await hhRPS.commit(hash, { value: 2 });
      hash = await hhRPS.hashPacked(addr1.address, 2);
      await hhRPS.connect(addr1).commit(hash, { value: 2 });
      expect(await hhRPS.stage()).to.equal(2);
      const commit = await hhRPS.players(1);
      expect(commit.playerAddress).to.equal(addr1.address);
      expect(commit.commitment).to.equal(hash);
      expect(commit.choice).to.equal(0);
      expect(commit.playerBet).to.equal(2);
    });

    it("Should revert third commit", async function () {
      const { hhRPS, owner, addr1 } = await loadFixture(
        challengeSuccessfulFixture
      );

      let hash = await hhRPS.hashPacked(owner.address, 2);
      await hhRPS.commit(hash, { value: 2 });
      hash = await hhRPS.hashPacked(addr1.address, 2);
      await hhRPS.connect(addr1).commit(hash, { value: 2 });
      await expect(hhRPS.commit(hash, { value: 2 })).to.be.reverted;
    });
  });

  describe("Reveal", function () {
    it("Should revert due to player not challenged", async function () {
      const { hhRPS, addr2 } = await loadFixture(commitSuccessfulFixture);

      await expect(hhRPS.connect(addr2).reveal(2)).to.be.reverted;
    });

    it("Should revert due to incorrect choice value", async function () {
      const { hhRPS } = await loadFixture(commitSuccessfulFixture);

      await expect(hhRPS.reveal(7)).to.be.reverted;
    });

    it("Should revert due to incorrect commit hash", async function () {
      const { hhRPS } = await loadFixture(commitSuccessfulFixture);

      await expect(hhRPS.reveal(1)).to.be.reverted;
    });

    it("Should reveal first successfully", async function () {
      const { hhRPS } = await loadFixture(commitSuccessfulFixture);

      expect(await hhRPS.stage()).to.equal(2);
      await hhRPS.reveal(2);
      expect(await hhRPS.stage()).to.equal(3);
    });

    it("Should reveal second successfully", async function () {
      const { hhRPS, addr1 } = await loadFixture(commitSuccessfulFixture);

      expect(await hhRPS.stage()).to.equal(2);
      await hhRPS.reveal(2);
      await hhRPS.connect(addr1).reveal(2);
      expect(await hhRPS.stage()).to.equal(4);
    });
  });

  describe("Declare Winner", function () {
    it("Should revert due to previous stage", async function () {
      const { hhRPS, owner } = await loadFixture(deployRPSFixture);

      await expect(hhRPS.declareWinner()).to.be.reverted;
    });

    it("Should declare winner owner", async function () {
      const { hhRPS, owner } = await loadFixture(revealSuccessfulFixture);

      await expect(hhRPS.declareWinner())
        .to.emit(hhRPS, "DeclareWinner")
        .withArgs(owner.address, 4);
    });
  });
});
