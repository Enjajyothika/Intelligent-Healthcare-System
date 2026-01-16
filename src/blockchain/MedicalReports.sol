// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalReports {
    struct Report {
        address uploader;
        string fileHash;
        uint256 timestamp;
    }

    Report[] public reports;

    function storeReportHash(string memory _fileHash) public {
        reports.push(
            Report({
                uploader: msg.sender,
                fileHash: _fileHash,
                timestamp: block.timestamp
            })
        );
    }

    function getReport(uint256 index)
        public
        view
        returns (address, string memory, uint256)
    {
        Report memory r = reports[index];
        return (r.uploader, r.fileHash, r.timestamp);
    }

    function totalReports() public view returns (uint256) {
        return reports.length;
    }
}
