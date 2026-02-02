const { expect } = require("chai");
const { ethers } = require("hardhat");

function unwrapIndexed(arg) {
  return arg && typeof arg === "object" && "value" in arg ? arg.value : arg;
}

describe("ClassManager", function () {
  let classManager;
  let owner;
  let teacher;
  let student1;
  let student2;

  beforeEach(async function () {
    [owner, teacher, student1, student2] = await ethers.getSigners();

    const ClassManager = await ethers.getContractFactory("ClassManager");
    classManager = await ClassManager.deploy();
    await classManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await classManager.getAddress()).to.be.properAddress;
    });

    it("Should have zero classes initially", async function () {
      expect(await classManager.getClassCount()).to.equal(0);
    });
  });

  describe("Class Creation", function () {
    it("Should create a new class", async function () {
      const classId = "CS101";
      const tx = await classManager.connect(teacher).createClass(classId);
      await expect(tx).to.emit(classManager, "ClassCreated");

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.eventName === "ClassCreated"
      );

      expect(event).to.not.be.undefined;
      const [, rawTeacher, timestamp] = event.args;
      const eventTeacher = unwrapIndexed(rawTeacher);
      expect(eventTeacher).to.equal(teacher.address);
      expect(timestamp).to.be.gt(0);

      expect(await classManager.getClassCount()).to.equal(1);
      expect(await classManager.getClassIdAt(0)).to.equal(classId);

      const classInfo = await classManager.getClassInfo(classId);
      expect(classInfo.classId).to.equal(classId);
      expect(classInfo.teacher).to.equal(teacher.address);
      expect(classInfo.status).to.equal(0); // OPEN
    });

    it("Should not allow duplicate class IDs", async function () {
      const classId = "CS101";
      await classManager.connect(teacher).createClass(classId);

      await expect(
        classManager.connect(teacher).createClass(classId)
      ).to.be.revertedWith("ClassManager: Class ID already exists");
    });

    it("Should not allow empty class ID", async function () {
      await expect(
        classManager.connect(teacher).createClass("")
      ).to.be.revertedWith("ClassManager: Class ID cannot be empty");
    });
  });

  describe("Student Management", function () {
    beforeEach(async function () {
      await classManager.connect(teacher).createClass("CS101");
    });

    it("Should add student to whitelist", async function () {
      const classId = "CS101";
      await expect(
        classManager
          .connect(teacher)
          .addStudent(classId, student1.address)
      )
        .to.emit(classManager, "StudentAdded")
        .withArgs(classId, student1.address, teacher.address);

      expect(
        await classManager.isStudentAllowed(classId, student1.address)
      ).to.be.true;
    });

    it("Should not allow non-teacher to add students", async function () {
      const classId = "CS101";
      await expect(
        classManager
          .connect(student1)
          .addStudent(classId, student2.address)
      ).to.be.revertedWith("ClassManager: Only teacher can perform this action");
    });

    it("Should remove student from whitelist", async function () {
      const classId = "CS101";
      await classManager
        .connect(teacher)
        .addStudent(classId, student1.address);

      await expect(
        classManager
          .connect(teacher)
          .removeStudent(classId, student1.address)
      )
        .to.emit(classManager, "StudentRemoved")
        .withArgs(classId, student1.address, teacher.address);

      expect(
        await classManager.isStudentAllowed(classId, student1.address)
      ).to.be.false;
    });

    it("Should not allow adding student to non-existent class", async function () {
      await expect(
        classManager
          .connect(teacher)
          .addStudent("INVALID", student1.address)
      ).to.be.revertedWith("ClassManager: Class does not exist");
    });
  });

  describe("Class Closing", function () {
    beforeEach(async function () {
      await classManager.connect(teacher).createClass("CS101");
      await classManager
        .connect(teacher)
        .addStudent("CS101", student1.address);
    });

    it("Should close class", async function () {
      const classId = "CS101";
      const tx = await classManager.connect(teacher).closeClass(classId);
      await expect(tx).to.emit(classManager, "ClassClosed");

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.eventName === "ClassClosed"
      );

      expect(event).to.not.be.undefined;
      const [, rawTeacher, timestamp] = event.args;
      const eventTeacher = unwrapIndexed(rawTeacher);
      expect(eventTeacher).to.equal(teacher.address);
      expect(timestamp).to.be.gt(0);

      const classInfo = await classManager.getClassInfo(classId);
      expect(classInfo.status).to.equal(1); // CLOSED
    });

    it("Should not allow adding students after class is closed", async function () {
      const classId = "CS101";
      await classManager.connect(teacher).closeClass(classId);

      await expect(
        classManager
          .connect(teacher)
          .addStudent(classId, student2.address)
      ).to.be.revertedWith("ClassManager: Class is closed");
    });

    it("Should return false for isStudentAllowed when class is closed", async function () {
      const classId = "CS101";
      await classManager.connect(teacher).closeClass(classId);

      expect(
        await classManager.isStudentAllowed(classId, student1.address)
      ).to.be.false;
    });

    it("Should not allow closing already closed class", async function () {
      const classId = "CS101";
      await classManager.connect(teacher).closeClass(classId);

      await expect(
        classManager.connect(teacher).closeClass(classId)
      ).to.be.revertedWith("ClassManager: Class is closed");
    });

    it("Should not allow non-teacher to close class", async function () {
      const classId = "CS101";
      await expect(
        classManager.connect(student1).closeClass(classId)
      ).to.be.revertedWith("ClassManager: Only teacher can perform this action");
    });
  });

  describe("Edge Cases and Additional Tests", function () {
    it("Should handle multiple classes correctly", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await classManager.connect(teacher).createClass("CS102");
      await classManager.connect(teacher).createClass("CS103");

      expect(await classManager.getClassCount()).to.equal(3);
      expect(await classManager.getClassIdAt(0)).to.equal("CS101");
      expect(await classManager.getClassIdAt(1)).to.equal("CS102");
      expect(await classManager.getClassIdAt(2)).to.equal("CS103");
    });

    it("Should not allow getting classIdAt with invalid index", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await expect(
        classManager.getClassIdAt(1)
      ).to.be.revertedWith("ClassManager: Index out of bounds");
    });

    it("Should not allow getting info for non-existent class", async function () {
      await expect(
        classManager.getClassInfo("INVALID")
      ).to.be.revertedWith("ClassManager: Class does not exist");
    });

    it("Should emit PermissionUpdated event when adding student", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await expect(
        classManager.connect(teacher).addStudent("CS101", student1.address)
      )
        .to.emit(classManager, "PermissionUpdated")
        .withArgs("CS101", student1.address, true, teacher.address);
    });

    it("Should emit PermissionUpdated event when removing student", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await classManager.connect(teacher).addStudent("CS101", student1.address);
      await expect(
        classManager.connect(teacher).removeStudent("CS101", student1.address)
      )
        .to.emit(classManager, "PermissionUpdated")
        .withArgs("CS101", student1.address, false, teacher.address);
    });

    it("Should not allow adding zero address as student", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await expect(
        classManager
          .connect(teacher)
          .addStudent("CS101", ethers.ZeroAddress)
      ).to.be.revertedWith("ClassManager: Invalid student address");
    });

    it("Should not allow removing student not in whitelist", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await expect(
        classManager
          .connect(teacher)
          .removeStudent("CS101", student1.address)
      ).to.be.revertedWith("ClassManager: Student not in whitelist");
    });

    it("Should not allow adding same student twice", async function () {
      await classManager.connect(teacher).createClass("CS101");
      await classManager
        .connect(teacher)
        .addStudent("CS101", student1.address);
      await expect(
        classManager
          .connect(teacher)
          .addStudent("CS101", student1.address)
      ).to.be.revertedWith("ClassManager: Student already added");
    });

    it("Should return false for isStudentAllowed for non-existent class", async function () {
      expect(
        await classManager.isStudentAllowed("INVALID", student1.address)
      ).to.be.false;
    });

    it("Should return false for isStudentAllowed for non-whitelisted student", async function () {
      await classManager.connect(teacher).createClass("CS101");
      expect(
        await classManager.isStudentAllowed("CS101", student1.address)
      ).to.be.false;
    });

    it("Should track closedAt timestamp when closing class", async function () {
      await classManager.connect(teacher).createClass("CS101");
      const beforeClose = await ethers.provider.getBlock("latest");
      await classManager.connect(teacher).closeClass("CS101");
      const afterClose = await ethers.provider.getBlock("latest");

      const classInfo = await classManager.getClassInfo("CS101");
      expect(classInfo.closedAt).to.be.gt(0);
      expect(classInfo.closedAt).to.be.gte(beforeClose.timestamp);
      expect(classInfo.closedAt).to.be.lte(afterClose.timestamp);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should measure gas for creating class", async function () {
      await classManager.connect(teacher).createClass("CS101");
      const tx = await classManager.connect(teacher).createClass("CS102");
      const receipt = await tx.wait();
      console.log(`      Gas used for createClass: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000); // Reasonable gas limit
    });

    it("Should measure gas for adding student", async function () {
      await classManager.connect(teacher).createClass("CS101");
      const tx = await classManager
        .connect(teacher)
        .addStudent("CS101", student1.address);
      const receipt = await tx.wait();
      console.log(`      Gas used for addStudent: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(150000);
    });
  });

  // Phase 3.2: Approval Workflow Tests
  describe("Approval Workflow (Phase 3.2)", function () {
    beforeEach(async function () {
      // Create a class before each approval test
      await classManager.connect(teacher).createClass("APPROVAL101");
    });

    it("Should allow teacher to approve student", async function () {
      const tx = await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student1.address);
      
      const receipt = await tx.wait();
      expect(receipt).to.exist;

      // Verify approval was recorded
      const approvalInfo = await classManager.getApprovalInfo(
        "APPROVAL101",
        student1.address
      );
      expect(approvalInfo[0]).to.equal(true);
      expect(approvalInfo[2]).to.equal(teacher.address);
    });

    it("Should not allow non-teacher to approve student", async function () {
      await expect(
        classManager
          .connect(student1)
          .approveAndAddStudent("APPROVAL101", student2.address)
      ).to.be.revertedWith("ClassManager: Only teacher can perform this action");
    });

    it("Should emit StudentApproved event when approving", async function () {
      const tx = await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student1.address);

      await expect(tx).to.emit(classManager, "StudentApproved");
    });

    it("Should track approver and timestamp correctly", async function () {
      const tx = await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const approvalInfo = await classManager.getApprovalInfo(
        "APPROVAL101",
        student1.address
      );

      expect(approvalInfo[0]).to.equal(true);
      expect(approvalInfo[2]).to.equal(teacher.address);
      expect(approvalInfo[1]).to.equal(block.timestamp);
    });

    it("Should not allow approving already approved student", async function () {
      // First approval
      await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student1.address);

      // Try to approve again
      await expect(
        classManager
          .connect(teacher)
          .approveAndAddStudent("APPROVAL101", student1.address)
      ).to.be.revertedWith("ClassManager: Student already approved");
    });

    it("Should not allow approving zero address", async function () {
      await expect(
        classManager
          .connect(teacher)
          .approveAndAddStudent("APPROVAL101", ethers.ZeroAddress)
      ).to.be.revertedWith("ClassManager: Invalid student address");
    });

    it("Should not allow approving student in closed class", async function () {
      // Close the class first
      await classManager.connect(teacher).closeClass("APPROVAL101");

      // Try to approve in closed class
      await expect(
        classManager
          .connect(teacher)
          .approveAndAddStudent("APPROVAL101", student1.address)
      ).to.be.revertedWith("ClassManager: Class is closed");
    });

    it("Should return correct approval info for unapproved student", async function () {
      const approvalInfo = await classManager.getApprovalInfo(
        "APPROVAL101",
        student1.address
      );

      expect(approvalInfo[0]).to.equal(false);
      expect(approvalInfo[1]).to.equal(0);
      expect(approvalInfo[2]).to.equal(ethers.ZeroAddress);
    });

    it("Should handle multiple approvals in same class", async function () {
      // Approve two students
      await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student1.address);
      await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student2.address);

      // Verify both are approved
      const [approved1] = await classManager.getApprovalInfo(
        "APPROVAL101",
        student1.address
      );
      const [approved2] = await classManager.getApprovalInfo(
        "APPROVAL101",
        student2.address
      );

      expect(approved1).to.equal(true);
      expect(approved2).to.equal(true);
    });

    it("Should measure gas for approveAndAddStudent", async function () {
      const tx = await classManager
        .connect(teacher)
        .approveAndAddStudent("APPROVAL101", student1.address);
      const receipt = await tx.wait();
      console.log(`      Gas used for approveAndAddStudent: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });
  });
});
