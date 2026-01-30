const { expect } = require("chai");
const { ethers } = require("hardhat");

function unwrapIndexed(arg) {
  return arg && typeof arg === "object" && "value" in arg ? arg.value : arg;
}

describe("ScoreManager", function () {
  let scoreManager;
  let classManager;
  let owner;
  let teacher;
  let student1;
  let student2;

  beforeEach(async function () {
    [owner, teacher, student1, student2] = await ethers.getSigners();

    // Deploy ClassManager first
    const ClassManager = await ethers.getContractFactory("ClassManager");
    classManager = await ClassManager.deploy();
    await classManager.waitForDeployment();
    const classManagerAddress = await classManager.getAddress();

    // Deploy ScoreManager
    const ScoreManager = await ethers.getContractFactory("ScoreManager");
    scoreManager = await ScoreManager.deploy(
      teacher.address,
      classManagerAddress
    );
    await scoreManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await scoreManager.getAddress()).to.be.properAddress;
    });

    it("Should set correct teacher address", async function () {
      expect(await scoreManager.teacher()).to.equal(teacher.address);
    });

    it("Should set correct ClassManager address", async function () {
      expect(await scoreManager.classManagerAddress()).to.equal(
        await classManager.getAddress()
      );
    });
  });

  describe("Class Registration", function () {
    it("Should register a new class (must exist in ClassManager first)", async function () {
      const classId = "CS101";
      // First create class in ClassManager
      await classManager.connect(teacher).createClass(classId);
      
      await expect(scoreManager.connect(teacher).registerClass(classId))
        .to.emit(scoreManager, "ClassRegistered")
        .withArgs(classId, teacher.address);
    });

    it("Should not allow registering class that doesn't exist in ClassManager", async function () {
      const classId = "CS101";
      // Don't create class in ClassManager first
      await expect(
        scoreManager.connect(teacher).registerClass(classId)
      ).to.be.revertedWith("ScoreManager: Class does not exist in ClassManager");
    });

    it("Should not allow non-teacher to register class", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await expect(
        scoreManager.connect(student1).registerClass("CS101")
      ).to.be.revertedWith("ScoreManager: Only teacher can perform this action");
    });

    it("Should not allow duplicate class registration", async function () {
      const classId = "CS101";
      await classManager.connect(teacher).createClass(classId);
      await scoreManager.connect(teacher).registerClass(classId);

      await expect(
        scoreManager.connect(teacher).registerClass(classId)
      ).to.be.revertedWith("ScoreManager: Class already registered");
    });

    it("Should not allow empty class ID", async function () {
      await expect(
        scoreManager.connect(teacher).registerClass("")
      ).to.be.revertedWith("ScoreManager: Class ID cannot be empty");
    });
  });

  describe("Assignment Submission", function () {
    beforeEach(async function () {
      // Setup: Create class in ClassManager and register in ScoreManager
      await classManager.connect(teacher).createClass("CS101");
      await scoreManager.connect(teacher).registerClass("CS101");
      // Add student to whitelist
      await classManager.connect(teacher).addStudent("CS101", student1.address);
    });

    it("Should allow whitelisted student to submit assignment", async function () {
      const classId = "CS101";
      const assignmentHash = ethers.keccak256(
        ethers.toUtf8Bytes("assignment1")
      );

      const tx = await scoreManager
        .connect(student1)
        .submitAssignment(classId, assignmentHash);
      await expect(tx).to.emit(scoreManager, "AssignmentSubmitted");

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.eventName === "AssignmentSubmitted"
      );

      expect(event).to.not.be.undefined;
      const [, rawStudent, eventHash, timestamp] = event.args;
      const eventStudent = unwrapIndexed(rawStudent);
      expect(eventStudent).to.equal(student1.address);
      expect(eventHash).to.equal(assignmentHash);
      expect(timestamp).to.be.gt(0);

      const submission = await scoreManager.getSubmission(
        classId,
        student1.address
      );
      expect(submission.assignmentHash).to.equal(assignmentHash);
      expect(submission.exists).to.be.true;
    });

    it("Should not allow non-whitelisted student to submit", async function () {
      const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      // student2 is not whitelisted
      await expect(
        scoreManager
          .connect(student2)
          .submitAssignment("CS101", assignmentHash)
      ).to.be.revertedWith("ScoreManager: Student not allowed in this class");
    });

    it("Should not allow submission to non-existent class", async function () {
      const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));

      await expect(
        scoreManager
          .connect(student1)
          .submitAssignment("INVALID", assignmentHash)
      ).to.be.revertedWith("ScoreManager: Class does not exist in ClassManager");
    });

    it("Should not allow invalid assignment hash", async function () {
      await expect(
        scoreManager
          .connect(student1)
          .submitAssignment("CS101", ethers.ZeroHash)
      ).to.be.revertedWith("ScoreManager: Invalid assignment hash");
    });

    it("Should allow updating submission with new hash", async function () {
      const classId = "CS101";
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("assignment1-updated"));

      await scoreManager.connect(student1).submitAssignment(classId, hash1);
      await scoreManager.connect(student1).submitAssignment(classId, hash2);

      const submission = await scoreManager.getSubmission(classId, student1.address);
      expect(submission.assignmentHash).to.equal(hash2);
    });
  });

  describe("Score Recording", function () {
    beforeEach(async function () {
      await classManager.connect(teacher).createClass("CS101");
      await scoreManager.connect(teacher).registerClass("CS101");
    });

    it("Should allow teacher to record score", async function () {
      const classId = "CS101";
      const score = 85;

      const tx = await scoreManager
        .connect(teacher)
        .recordScore(classId, student1.address, score);
      await expect(tx).to.emit(scoreManager, "ScoreRecorded");

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.eventName === "ScoreRecorded"
      );

      expect(event).to.not.be.undefined;
      const [
        ,
        rawStudent,
        eventScore,
        recordedBy,
        timestamp,
      ] = event.args;
      const eventStudent = unwrapIndexed(rawStudent);
      expect(eventStudent).to.equal(student1.address);
      expect(eventScore).to.equal(score);
      expect(recordedBy).to.equal(teacher.address);
      expect(timestamp).to.be.gt(0);

      const scoreInfo = await scoreManager.getScore(classId, student1.address);
      expect(scoreInfo.score).to.equal(score);
      expect(scoreInfo.recordedBy).to.equal(teacher.address);
    });

    it("Should not allow non-teacher to record score", async function () {
      await expect(
        scoreManager
          .connect(student1)
          .recordScore("CS101", student2.address, 85)
      ).to.be.revertedWith("ScoreManager: Only teacher can perform this action");
    });

    it("Should not allow score out of range", async function () {
      await expect(
        scoreManager
          .connect(teacher)
          .recordScore("CS101", student1.address, 1001)
      ).to.be.revertedWith("ScoreManager: Score out of range");
    });

    it("Should allow score of 0", async function () {
      await expect(
        scoreManager
          .connect(teacher)
          .recordScore("CS101", student1.address, 0)
      ).to.not.be.reverted;
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await classManager.connect(teacher).createClass("CS101");
      await scoreManager.connect(teacher).registerClass("CS101");
    });

    it("Should return correct submission info", async function () {
      const classId = "CS101";
      const assignmentHash = ethers.keccak256(
        ethers.toUtf8Bytes("assignment1")
      );

      // Thêm sinh viên vào whitelist trước khi nộp bài
      await classManager
        .connect(teacher)
        .addStudent(classId, student1.address);

      await scoreManager
        .connect(student1)
        .submitAssignment(classId, assignmentHash);

      const submission = await scoreManager.getSubmission(
        classId,
        student1.address
      );
      expect(submission.assignmentHash).to.equal(assignmentHash);
      expect(submission.exists).to.be.true;
    });

    it("Should return false for hasSubmitted when not submitted", async function () {
      expect(
        await scoreManager.hasSubmitted("CS101", student1.address)
      ).to.be.false;
    });

    it("Should return true for hasSubmitted when submitted", async function () {
      // Need to add student first
      await classManager.connect(teacher).addStudent("CS101", student1.address);
      
      const assignmentHash = ethers.keccak256(
        ethers.toUtf8Bytes("assignment1")
      );
      await scoreManager
        .connect(student1)
        .submitAssignment("CS101", assignmentHash);

      expect(
        await scoreManager.hasSubmitted("CS101", student1.address)
      ).to.be.true;
    });
  });

  describe("Edge Cases and Additional Tests", function () {
    beforeEach(async function () {
      await classManager.connect(teacher).createClass("CS101");
      await scoreManager.connect(teacher).registerClass("CS101");
    });

    it("Should handle multiple students and classes", async function () {
      await classManager.connect(teacher).createClass("CS102");
      await scoreManager.connect(teacher).registerClass("CS102");

      await classManager.connect(teacher).addStudent("CS101", student1.address);
      await classManager.connect(teacher).addStudent("CS102", student1.address);
      await classManager.connect(teacher).addStudent("CS102", student2.address);

      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cs101-assignment"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cs102-assignment"));

      await scoreManager.connect(student1).submitAssignment("CS101", hash1);
      await scoreManager.connect(student1).submitAssignment("CS102", hash2);
      await scoreManager.connect(student2).submitAssignment("CS102", hash2);

      expect(await scoreManager.hasSubmitted("CS101", student1.address)).to.be.true;
      expect(await scoreManager.hasSubmitted("CS102", student1.address)).to.be.true;
      expect(await scoreManager.hasSubmitted("CS102", student2.address)).to.be.true;
    });

    it("Should return zero score for student without recorded score", async function () {
      const [score] = await scoreManager.getScore("CS101", student1.address);
      expect(score).to.equal(0);
    });

    it("Should return empty submission for student without submission", async function () {
      const submission = await scoreManager.getSubmission("CS101", student1.address);
      expect(submission.exists).to.be.false;
      expect(submission.assignmentHash).to.equal(ethers.ZeroHash);
      expect(submission.submittedAt).to.equal(0);
    });

    it("Should not allow recording score for zero address", async function () {
      await expect(
        scoreManager
          .connect(teacher)
          .recordScore("CS101", ethers.ZeroAddress, 85)
      ).to.be.revertedWith("ScoreManager: Invalid student address");
    });

    it("Should allow maximum score (1000)", async function () {
      await classManager.connect(teacher).addStudent("CS101", student1.address);
      await expect(
        scoreManager
          .connect(teacher)
          .recordScore("CS101", student1.address, 1000)
      ).to.not.be.reverted;

      const [score] = await scoreManager.getScore("CS101", student1.address);
      expect(score).to.equal(1000);
    });

    it("Should track timestamp when recording score", async function () {
      await classManager.connect(teacher).addStudent("CS101", student1.address);
      const beforeRecord = await ethers.provider.getBlock("latest");
      await scoreManager
        .connect(teacher)
        .recordScore("CS101", student1.address, 85);
      const afterRecord = await ethers.provider.getBlock("latest");

      const [, recordedAt] = await scoreManager.getScore("CS101", student1.address);
      expect(recordedAt).to.be.gte(beforeRecord.timestamp);
      expect(recordedAt).to.be.lte(afterRecord.timestamp);
    });

    it("Should track timestamp when submitting assignment", async function () {
      await classManager.connect(teacher).addStudent("CS101", student1.address);
      const beforeSubmit = await ethers.provider.getBlock("latest");
      const hash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      await scoreManager.connect(student1).submitAssignment("CS101", hash);
      const afterSubmit = await ethers.provider.getBlock("latest");

      const [, submittedAt] = await scoreManager.getSubmission("CS101", student1.address);
      expect(submittedAt).to.be.gte(beforeSubmit.timestamp);
      expect(submittedAt).to.be.lte(afterSubmit.timestamp);
    });

    it("Should allow updating score", async function () {
      await classManager.connect(teacher).addStudent("CS101", student1.address);
      await scoreManager
        .connect(teacher)
        .recordScore("CS101", student1.address, 75);
      await scoreManager
        .connect(teacher)
        .recordScore("CS101", student1.address, 90);

      const [score] = await scoreManager.getScore("CS101", student1.address);
      expect(score).to.equal(90);
    });
  });

  describe("Gas Optimization Tests", function () {
    beforeEach(async function () {
      await classManager.connect(teacher).createClass("CS101");
      await scoreManager.connect(teacher).registerClass("CS101");
      await classManager.connect(teacher).addStudent("CS101", student1.address);
    });

    it("Should measure gas for submitting assignment", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      const tx = await scoreManager.connect(student1).submitAssignment("CS101", hash);
      const receipt = await tx.wait();
      console.log(`      Gas used for submitAssignment: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should measure gas for recording score", async function () {
      const tx = await scoreManager
        .connect(teacher)
        .recordScore("CS101", student1.address, 85);
      const receipt = await tx.wait();
      console.log(`      Gas used for recordScore: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(150000);
    });
  });
});
