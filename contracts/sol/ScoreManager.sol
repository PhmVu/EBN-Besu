// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IClassManager.sol";

/**
 * @title ScoreManager
 * @dev Smart contract quản lý điểm số và bài nộp của sinh viên
 */
contract ScoreManager {
    // Struct lưu thông tin điểm số
    struct ScoreInfo {
        uint256 score;
        uint256 recordedAt;
        address recordedBy;
    }

    // Struct lưu thông tin bài nộp
    struct SubmissionInfo {
        bytes32 assignmentHash;
        uint256 submittedAt;
        bool exists;
    }

    // Mapping từ classId => student address => ScoreInfo
    mapping(string => mapping(address => ScoreInfo)) public scores;

    // Mapping từ classId => student address => SubmissionInfo
    mapping(string => mapping(address => SubmissionInfo)) public submissions;

    // Address của ClassManager contract
    address public classManagerAddress;

    // Mapping theo dõi các lớp đã được register trong ScoreManager
    mapping(string => bool) public registeredClasses;

    // Interface instance của ClassManager
    IClassManager private classManager;

    // Address của teacher (có thể là address hoặc contract)
    address public teacher;

    // Events
    event ScoreRecorded(
        string indexed classId,
        address indexed student,
        uint256 score,
        address indexed recordedBy,
        uint256 timestamp
    );

    event AssignmentSubmitted(
        string indexed classId,
        address indexed student,
        bytes32 assignmentHash,
        uint256 timestamp
    );

    event ClassRegistered(
        string indexed classId,
        address indexed teacher
    );

    // Modifier kiểm tra chỉ teacher mới được gọi
    modifier onlyTeacher() {
        require(
            msg.sender == teacher,
            "ScoreManager: Only teacher can perform this action"
        );
        _;
    }

    // Modifier kiểm tra classId phải tồn tại trong ClassManager
    modifier classMustExist(string memory classId) {
        require(
            classManager.classExists(classId),
            "ScoreManager: Class does not exist in ClassManager"
        );
        _;
    }

    /**
     * @dev Constructor
     * @param _teacher Địa chỉ của teacher
     * @param _classManagerAddress Địa chỉ của ClassManager contract
     */
    constructor(address _teacher, address _classManagerAddress) {
        require(
            _teacher != address(0),
            "ScoreManager: Invalid teacher address"
        );
        require(
            _classManagerAddress != address(0),
            "ScoreManager: Invalid ClassManager address"
        );

        teacher = _teacher;
        classManagerAddress = _classManagerAddress;
        classManager = IClassManager(_classManagerAddress);
    }

    /**
     * @dev Đăng ký lớp học mới (chỉ teacher)
     * @notice Lớp học phải đã được tạo trong ClassManager trước
     * @param classId ID của lớp học
     */
    function registerClass(string memory classId) public onlyTeacher {
        require(
            bytes(classId).length > 0,
            "ScoreManager: Class ID cannot be empty"
        );
        require(
            !registeredClasses[classId],
            "ScoreManager: Class already registered"
        );
        require(
            classManager.classExists(classId),
            "ScoreManager: Class does not exist in ClassManager"
        );

        registeredClasses[classId] = true;

        emit ClassRegistered(classId, msg.sender);
    }

    /**
     * @dev Sinh viên nộp bài (hash của bài nộp)
     * @param classId ID của lớp học
     * @param assignmentHash Hash của bài nộp
     */
    function submitAssignment(
        string memory classId,
        bytes32 assignmentHash
    ) public classMustExist(classId) {
        // Kiểm tra sinh viên có được phép không (qua ClassManager)
        require(
            classManager.isStudentAllowed(classId, msg.sender),
            "ScoreManager: Student not allowed in this class"
        );

        require(
            assignmentHash != bytes32(0),
            "ScoreManager: Invalid assignment hash"
        );

        // Lưu thông tin bài nộp
        submissions[classId][msg.sender] = SubmissionInfo({
            assignmentHash: assignmentHash,
            submittedAt: block.timestamp,
            exists: true
        });

        emit AssignmentSubmitted(
            classId,
            msg.sender,
            assignmentHash,
            block.timestamp
        );
    }

    /**
     * @dev Teacher chấm điểm cho sinh viên
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     * @param score Điểm số (0-100 hoặc tùy scale)
     */
    function recordScore(
        string memory classId,
        address student,
        uint256 score
    ) public onlyTeacher classMustExist(classId) {
        require(
            student != address(0),
            "ScoreManager: Invalid student address"
        );
        require(
            score <= 1000, // Cho phép điểm từ 0-1000 (có thể scale)
            "ScoreManager: Score out of range"
        );

        scores[classId][student] = ScoreInfo({
            score: score,
            recordedAt: block.timestamp,
            recordedBy: msg.sender
        });

        emit ScoreRecorded(
            classId,
            student,
            score,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Lấy điểm số của sinh viên
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     * @return score Điểm số
     * @return recordedAt Thời gian chấm điểm
     * @return recordedBy Người chấm điểm
     */
    function getScore(
        string memory classId,
        address student
    )
        public
        view
        returns (
            uint256 score,
            uint256 recordedAt,
            address recordedBy
        )
    {
        ScoreInfo memory scoreInfo = scores[classId][student];
        return (scoreInfo.score, scoreInfo.recordedAt, scoreInfo.recordedBy);
    }

    /**
     * @dev Lấy thông tin bài nộp của sinh viên
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     * @return assignmentHash Hash của bài nộp
     * @return submittedAt Thời gian nộp bài
     * @return exists true nếu đã nộp bài, false nếu chưa
     */
    function getSubmission(
        string memory classId,
        address student
    )
        public
        view
        returns (
            bytes32 assignmentHash,
            uint256 submittedAt,
            bool exists
        )
    {
        SubmissionInfo memory submission = submissions[classId][student];
        return (
            submission.assignmentHash,
            submission.submittedAt,
            submission.exists
        );
    }

    /**
     * @dev Kiểm tra sinh viên đã nộp bài chưa
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     * @return submitted true nếu đã nộp, false nếu chưa
     */
    function hasSubmitted(
        string memory classId,
        address student
    ) public view returns (bool submitted) {
        return submissions[classId][student].exists;
    }
}

