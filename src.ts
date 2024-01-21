// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonTrading {
    struct CarbonCredit {
        address owner;
        uint amount;
    }

    mapping(address => CarbonCredit) public carbonCredits;

    uint256 public taxRate = 10; // 10% tax rate

    address public oracleAddress; // address of the oracle contract
    address public governmentAddress;

    // Events for logging important state changes
    event CarbonCreditsPurchased(address indexed buyer, uint amount, uint taxPaid);
    event CarbonCreditsSold(address indexed seller, uint amount, uint taxPaid);
    event CarbonCreditsConverted(address indexed converter, uint amount, uint fiatAmount, uint taxPaid);
    
    // Modifiers
    modifier onlyGovernment() {
        require(msg.sender == governmentAddress, "Not authorized");
        _;
    }

    constructor(address _oracleAddress, address _governmentAddress) {
        oracleAddress = _oracleAddress;
        governmentAddress = _governmentAddress;
    }

    function setGovernmentAddress(address _newGovernmentAddress) external onlyGovernment {
        governmentAddress = _newGovernmentAddress;
    }

    function buyCarbonCredits(uint amount) external payable {
        require(msg.value >= amount, "Insufficient funds");

        uint256 tax = calculateTax(amount);
        require(msg.value >= amount + tax, "Insufficient funds for tax");

        carbonCredits[msg.sender].amount += amount;
        emit CarbonCreditsPurchased(msg.sender, amount, tax);
        governmentAddress.transfer(tax);
    }

    function sellCarbonCredits(uint amount) external {
        require(carbonCredits[msg.sender].amount >= amount, "Insufficient carbon credits");

        uint256 tax = calculateTax(amount);
        require(carbonCredits[msg.sender].amount >= amount + tax, "Insufficient carbon credits for tax");

        carbonCredits[msg.sender].amount -= amount;
        emit CarbonCreditsSold(msg.sender, amount, tax);
        msg.sender.transfer(amount - tax);
        governmentAddress.transfer(tax);
    }

    function convertCarbonCreditsToFiat(uint amount) external {
        require(carbonCredits[msg.sender].amount >= amount, "Insufficient carbon credits");

        uint256 price = getCarbonCreditPrice();
        require(price > 0, "Invalid carbon credit price");

        uint256 tax = calculateTax(amount);
        require(carbonCredits[msg.sender].amount >= amount + tax, "Insufficient carbon credits for tax");

        carbonCredits[msg.sender].amount -= amount;
        uint256 fiatAmount = amount * price;
        emit CarbonCreditsConverted(msg.sender, amount, fiatAmount, tax);
        msg.sender.transfer(fiatAmount - tax);
        governmentAddress.transfer(tax);
    }

    // Function to get the current carbon credit price from the oracle
    function getCarbonCreditPrice() internal view returns (uint256) {
        // Use an interface for better code readability and to avoid potential errors
        IOracle oracle = IOracle(oracleAddress);
        return oracle.getCarbonCreditPrice();
    }

    // Function to calculate tax based on the tax rate
    function calculateTax(uint256 amount) internal view returns (uint256) {
        return (amount * taxRate) / 100;
    }
}

// Interface for the Oracle contract
interface IOracle {
    function getCarbonCreditPrice() external view returns (uint256);
}
