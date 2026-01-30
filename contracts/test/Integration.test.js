const { expect } = require("chai");
const { ethers } = require("hardhat");

function unwrapIndexed(arg) {
  return arg && typeof arg === "object" && "value" in arg ? arg.value : arg;
}

describe("Integration Tests: ClassManager + ScoreManager", function () {
  let classManager;
  let scoreManager;
  let owner;
  let teacher;
  let student1;
  let student2;

  beforeEach(async function () {
    [owner, teacher, student1, student2] = await ethers.getSigners();

    // Deploy ClassManager
    const ClassManager = await ethers.getContractFactory("ClassManager");
    classManager = await ClassManager.deploy();
    await classManager.waitForDeployment();

    // Deploy ScoreManager
    const ScoreManager = await ethers.getContractFactory("ScoreManager");
    scoreManager = await ScoreManager.deploy(
      teacher.address,
      await classManager.getAddress()
    );
    await scoreManager.waitForDeployment();
  });

  describe("Full Flow: Create Class, Add Student, Submit Assignment, Record Score", function () {
    const classId = "CS101";

    it("Should complete full flow: create class -> add student -> register class -> submit -> record score", async function () {
      // Step 1: Teacher creates class in ClassManager
      const txCreate = await classManager.connect(teacher).createClass(classId);
      await expect(txCreate).to.emit(classManager, "ClassCreated");

      const createReceipt = await txCreate.wait();
      const createEvent = createReceipt.logs.find(
        (log) => log.eventName === "ClassCreated"
      );
      expect(createEvent).to.not.be.undefined;
      const [, rawTeacher, createdAt] = createEvent.args;
      const createdTeacher = unwrapIndexed(rawTeacher);
      expect(createdTeacher).to.equal(teacher.address);
      expect(createdAt).to.be.gt(0);

      // Step 2: Teacher registers class in ScoreManager
      await expect(scoreManager.connect(teacher).registerClass(classId))
        .to.emit(scoreManager, "ClassRegistered")
        .withArgs(classId, teacher.address);

      // Step 3: Teacher adds student to ClassManager
      await expect(
        classManager.connect(teacher).addStudent(classId, student1.address)
      )
        .to.emit(classManager, "StudentAdded")
        .withArgs(classId, student1.address, teacher.address);

      // Verify student is allowed
      expect(
        await classManager.isStudentAllowed(classId, student1.address)
      ).to.be.true;

      // Step 4: Student submits assignment (should pass because whitelisted)
      const assignmentHash = ethers.keccak256(
        ethers.toUtf8Bytes("assignment1")
      );
      const txSubmit = await scoreManager
        .connect(student1)
        .submitAssignment(classId, assignmentHash);
      await expect(txSubmit).to.emit(scoreManager, "AssignmentSubmitted");

      const submitReceipt = await txSubmit.wait();
      const submitEvent = submitReceipt.logs.find(
        (log) => log.eventName === "AssignmentSubmitted"
      );
      expect(submitEvent).to.not.be.undefined;
      const [
        ,
        rawSubmitStudent,
        submittedHash,
        submittedAt,
      ] = submitEvent.args;
      const submittedStudent = unwrapIndexed(rawSubmitStudent);
      expect(submittedStudent).to.equal(student1.address);
      expect(submittedHash).to.equal(assignmentHash);
      expect(submittedAt).to.be.gt(0);

      // Verify submission
      const submission = await scoreManager.getSubmission(
        classId,
        student1.address
      );
      expect(submission.assignmentHash).to.equal(assignmentHash);
      expect(submission.exists).to.be.true;

      // Step 5: Teacher records score
      const score = 85;
      const txRecord = await scoreManager
        .connect(teacher)
        .recordScore(classId, student1.address, score);
      await expect(txRecord).to.emit(scoreManager, "ScoreRecorded");

      const recordReceipt = await txRecord.wait();
      const recordEvent = recordReceipt.logs.find(
        (log) => log.eventName === "ScoreRecorded"
      );
      expect(recordEvent).to.not.be.undefined;
      const [
        ,
        rawRecordStudent,
        recordedScoreFromEvent,
        recordedByFromEvent,
        recordedAtFromEvent,
      ] = recordEvent.args;
      const recordedStudent = unwrapIndexed(rawRecordStudent);
      expect(recordedStudent).to.equal(student1.address);
      expect(recordedScoreFromEvent).to.equal(score);
      expect(recordedByFromEvent).to.equal(teacher.address);
      expect(recordedAtFromEvent).to.be.gt(0);

      // Verify score
      const [recordedScore, recordedAt, recordedBy] = await scoreManager.getScore(
        classId,
        student1.address
      );
      expect(recordedScore).to.equal(score);
      expect(recordedBy).to.equal(teacher.address);
    });

    it("Should not allow non-whitelisted student to submit assignment", async function () {
      // Setup: Create class and register
      await classManager.connect(teacher).createClass(classId);
      await scoreManager.connect(teacher).registerClass(classId);

      // Don't add student2 to whitelist

      // Try to submit assignment (should fail)
      const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      await expect(
        scoreManager.connect(student2).submitAssignment(classId, assignmentHash)
      ).to.be.revertedWith("ScoreManager: Student not allowed in this class");
    });

    it("Should not allow submission after student is removed from whitelist", async function () {
      // Setup: Create class, register, add student
      await classManager.connect(teacher).createClass(classId);
      await scoreManager.connect(teacher).registerClass(classId);
      await classManager
        .connect(teacher)
        .addStudent(classId, student1.address);

      // Remove student from whitelist
      await classManager
        .connect(teacher)
        .removeStudent(classId, student1.address);

      // Try to submit assignment (should fail)
      const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      await expect(
        scoreManager.connect(student1).submitAssignment(classId, assignmentHash)
      ).to.be.revertedWith("ScoreManager: Student not allowed in this class");
    });

    it("Should not allow submission after class is closed", async function () {
      // Setup: Create class, register, add student
      await classManager.connect(teacher).createClass(classId);
      await scoreManager.connect(teacher).registerClass(classId);
      await classManager
        .connect(teacher)
        .addStudent(classId, student1.address);

      // Close class
      await classManager.connect(teacher).closeClass(classId);

      // Try to submit assignment (should fail because class is closed)
      const assignmentHash = ethers.keccak256(ethers.toUtf8Bytes("assignment1"));
      await expect(
        scoreManager.connect(student1).submitAssignment(classId, assignmentHash)
      ).to.be.revertedWith("ScoreManager: Student not allowed in this class");
    });

    it("Should allow multiple students to submit and get scores", async function () {
      // Setup
      await classManager.connect(teacher).createClass(classId);
      await scoreManager.connect(teacher).registerClass(classId);
      await classManager
        .connect(teacher)
        .addStudent(classId, student1.address);
      await classManager
        .connect(teacher)
        .addStudent(classId, student2.address);

      // Student1 submits
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("assignment1-student1"));
      await scoreManager.connect(student1).submitAssignment(classId, hash1);

      // Student2 submits
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("assignment1-student2"));
      await scoreManager.connect(student2).submitAssignment(classId, hash2);

      // Teacher records scores
      await scoreManager
        .connect(teacher)
        .recordScore(classId, student1.address, 90);
      await scoreManager
        .connect(teacher)
        .recordScore(classId, student2.address, 85);

      // Verify scores
      const [score1] = await scoreManager.getScore(classId, student1.address);
      const [score2] = await scoreManager.getScore(classId, student2.address);
      expect(score1).to.equal(90);
      expect(score2).to.equal(85);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple classes correctly", async function () {
      const classId1 = "CS101";
      const classId2 = "CS102";

      // Create two classes
      await classManager.connect(teacher).createClass(classId1);
      await classManager.connect(teacher).createClass(classId2);
      await scoreManager.connect(teacher).registerClass(classId1);
      await scoreManager.connect(teacher).registerClass(classId2);

      // Add student to both classes
      await classManager
        .connect(teacher)
        .addStudent(classId1, student1.address);
      await classManager
        .connect(teacher)
        .addStudent(classId2, student1.address);

      // Submit to both classes
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cs101-assignment"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cs102-assignment"));
      await scoreManager.connect(student1).submitAssignment(classId1, hash1);
      await scoreManager.connect(student1).submitAssignment(classId2, hash2);

      // Record different scores
      await scoreManager
        .connect(teacher)
        .recordScore(classId1, student1.address, 90);
      await scoreManager
        .connect(teacher)
        .recordScore(classId2, student1.address, 85);

      // Verify scores are separate
      const [score1] = await scoreManager.getScore(classId1, student1.address);
      const [score2] = await scoreManager.getScore(classId2, student1.address);
      expect(score1).to.equal(90);
      expect(score2).to.equal(85);
    });
  });
});
