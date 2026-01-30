// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ClassManager
 * @dev Smart contract quản lý lớp học, whitelist sinh viên và phân quyền
 */
contract ClassManager {
    // Enum cho trạng thái lớp học
    enum ClassStatus {
        OPEN,
        CLOSED
    }

    // Struct lưu thông tin lớp học
    struct ClassInfo {
        string classId;
        address teacher;
        ClassStatus status;
        uint256 createdAt;
        uint256 closedAt;
    }

    // Mapping từ classId đến ClassInfo
    mapping(string => ClassInfo) public classes;

    // Mapping từ classId => student address => allowed
    mapping(string => mapping(address => bool)) public allowedStudents;

    // Mapping để kiểm tra classId đã tồn tại
    mapping(string => bool) public classExists;

    // Danh sách tất cả classId
    string[] public allClassIds;

    // Events
    event ClassCreated(
        string indexed classId,
        address indexed teacher,
        uint256 timestamp
    );

    event StudentAdded(
        string indexed classId,
        address indexed student,
        address indexed teacher
    );

    event StudentRemoved(
        string indexed classId,
        address indexed student,
        address indexed teacher
    );

    event ClassClosed(
        string indexed classId,
        address indexed teacher,
        uint256 timestamp
    );

    event PermissionUpdated(
        string indexed classId,
        address indexed student,
        bool allowed,
        address indexed teacher
    );

    // Modifier kiểm tra chỉ teacher của lớp mới được gọi
    modifier onlyTeacher(string memory classId) {
        require(
            classes[classId].teacher == msg.sender,
            "ClassManager: Only teacher can perform this action"
        );
        require(
            classExists[classId],
            "ClassManager: Class does not exist"
        );
        _;
    }

    // Modifier kiểm tra lớp phải đang mở
    modifier onlyWhenOpen(string memory classId) {
        require(
            classes[classId].status == ClassStatus.OPEN,
            "ClassManager: Class is closed"
        );
        _;
    }

    /**
     * @dev Tạo lớp học mới
     * @param classId ID duy nhất của lớp học
     */
    function createClass(string memory classId) public {
        require(
            !classExists[classId],
            "ClassManager: Class ID already exists"
        );
        require(
            bytes(classId).length > 0,
            "ClassManager: Class ID cannot be empty"
        );

        classes[classId] = ClassInfo({
            classId: classId,
            teacher: msg.sender,
            status: ClassStatus.OPEN,
            createdAt: block.timestamp,
            closedAt: 0
        });

        classExists[classId] = true;
        allClassIds.push(classId);

        emit ClassCreated(classId, msg.sender, block.timestamp);
    }

    /**
     * @dev Thêm sinh viên vào whitelist
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     */
    function addStudent(
        string memory classId,
        address student
    ) public onlyTeacher(classId) onlyWhenOpen(classId) {
        require(
            student != address(0),
            "ClassManager: Invalid student address"
        );
        require(
            !allowedStudents[classId][student],
            "ClassManager: Student already added"
        );

        allowedStudents[classId][student] = true;

        emit StudentAdded(classId, student, msg.sender);
        emit PermissionUpdated(classId, student, true, msg.sender);
    }

    /**
     * @dev Xóa sinh viên khỏi whitelist
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     */
    function removeStudent(
        string memory classId,
        address student
    ) public onlyTeacher(classId) onlyWhenOpen(classId) {
        require(
            allowedStudents[classId][student],
            "ClassManager: Student not in whitelist"
        );

        allowedStudents[classId][student] = false;

        emit StudentRemoved(classId, student, msg.sender);
        emit PermissionUpdated(classId, student, false, msg.sender);
    }

    /**
     * @dev Đóng lớp học - chặn ghi dữ liệu mới
     * @param classId ID của lớp học
     */
    function closeClass(
        string memory classId
    ) public onlyTeacher(classId) onlyWhenOpen(classId) {
        classes[classId].status = ClassStatus.CLOSED;
        classes[classId].closedAt = block.timestamp;

        emit ClassClosed(classId, msg.sender, block.timestamp);
    }

    /**
     * @dev Kiểm tra sinh viên có được phép hay không
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     * @return allowed true nếu sinh viên được phép, false nếu không
     */
    function isStudentAllowed(
        string memory classId,
        address student
    ) public view returns (bool allowed) {
        if (!classExists[classId]) {
            return false;
        }
        if (classes[classId].status == ClassStatus.CLOSED) {
            return false;
        }
        return allowedStudents[classId][student];
    }

    /**
     * @dev Lấy thông tin lớp học
     * @param classId ID của lớp học
     * @return classInfo Thông tin lớp học
     */
    function getClassInfo(
        string memory classId
    ) public view returns (ClassInfo memory classInfo) {
        require(
            classExists[classId],
            "ClassManager: Class does not exist"
        );
        return classes[classId];
    }

    /**
     * @dev Lấy số lượng lớp học
     * @return count Số lượng lớp học
     */
    function getClassCount() public view returns (uint256 count) {
        return allClassIds.length;
    }

    /**
     * @dev Lấy classId tại index
     * @param index Index trong danh sách
     * @return classId ID của lớp học
     */
    function getClassIdAt(
        uint256 index
    ) public view returns (string memory classId) {
        require(
            index < allClassIds.length,
            "ClassManager: Index out of bounds"
        );
        return allClassIds[index];
    }
}
