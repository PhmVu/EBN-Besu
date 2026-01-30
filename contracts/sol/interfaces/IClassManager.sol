// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IClassManager
 * @dev Interface for ClassManager contract to enable integration with ScoreManager
 */
interface IClassManager {
    /**
     * @dev Kiểm tra sinh viên có được phép hay không
     * @param classId ID của lớp học
     * @param student Địa chỉ ví của sinh viên
     * @return allowed true nếu sinh viên được phép, false nếu không
     */
    function isStudentAllowed(
        string memory classId,
        address student
    ) external view returns (bool allowed);

    /**
     * @dev Kiểm tra classId có tồn tại không
     * @param classId ID của lớp học
     * @return exists true nếu class tồn tại, false nếu không
     */
    function classExists(string memory classId)
        external
        view
        returns (bool exists);

    /**
     * @dev Lấy thông tin lớp học
     * @param classId ID của lớp học
     * @return classIdOut ID của lớp học
     * @return teacher Địa chỉ của giáo viên
     * @return status Trạng thái lớp (0 = OPEN, 1 = CLOSED)
     * @return createdAt Thời gian tạo
     * @return closedAt Thời gian đóng (0 nếu chưa đóng)
     */
    function getClassInfo(
        string memory classId
    )
        external
        view
        returns (
            string memory classIdOut,
            address teacher,
            uint8 status,
            uint256 createdAt,
            uint256 closedAt
        );
}

