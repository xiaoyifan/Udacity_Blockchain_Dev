pragma solidity >=0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

   struct Airline {
        bool isRegistered;
        bool isFunded;
        string name;
        bytes32[] flightKeys;
    }

    mapping(address => Airline) private airlines;
    address[] registeredAirlines = new address[](0);
    address[] fundedAirlines = new address[](0);

   struct Flight {
        bool isRegistered;
        string name;
        uint8 statusCode;
        uint256 departure;
        address airline;
    }

    mapping (address => bytes32[]) private flightsByAirlines;
    mapping(bytes32 => Flight) private flights;
    bytes32[] registeredFlights = new bytes32[](0);

    // struct Votes{
    //     uint votersCount;
    //     mapping(address => bool) voters;
    // }

    struct Insurance {
        address passenger;
        address airline;
        uint amount;
        uint256 multiplier;
        bool isCredited;
    }

    mapping (bytes32 => Insurance[]) insuredPassengersPerFlight; // Key is the flight key.
    mapping (address => uint) public pendingPayments;

    // Restrict data contract callers
    mapping(address => uint256) private authorizedContracts;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlineRegistered(string airlineName, address airlineAddress);
    event AirlineFunded(string airlineName, address airlineAddress);
    event FlightRegistered(bytes32 flightKey, address airline, string name, uint256 timestamp);
    event InsuranceBought(address airline, string flight, uint256 timestamp, address passenger, uint amount, uint256 multiplier);
    event InsureeCredited(address passenger, uint amount);
    event AccountWithdrawn(address passenger, uint amount);
    event FlightStatusUpdated(address airline, string flight, uint256 timestamp, uint8 statusCode);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(string memory firstAirlineName, address firstAirlineAddress) public {
        contractOwner = msg.sender;
        // Airline Contract Initialization: First airline is registered when contract is deployed
        airlines[firstAirlineAddress] = Airline({
         name: firstAirlineName,
         isFunded: false,
         isRegistered: true,
         flightKeys: new bytes32[](0)
        });
        registeredAirlines.push(firstAirlineAddress);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }


    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }


    modifier requireIsCallerAuthorized() {
     require(authorizedContracts[msg.sender] == 1, "Caller is not authorized");
     _;
    }


    modifier requireAirlineIsFunded(address airline) {
     require(airlines[airline].isFunded, "Only existing and funded airlines are allowed(data)");
     _;
    }
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }

    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    function getRegisteredAirlinesCount() external view returns(uint) {
        return registeredAirlines.length;
    }
    
    function getInsurancesCount(address airline, string calldata name, uint256 timestamp) external view returns(uint) {
        bytes32 flightKey = getFlightKey(airline, name, timestamp);
        return insuredPassengersPerFlight[flightKey].length;
    }

    function getAirlineName(address airline) external view returns(string memory) {
        return airlines[airline].name;
    }

    function isAirline(address airline) external view returns(bool) {
        return airlines[airline].isRegistered;
    }

    function isFundedAirline(address airline) external view returns(bool) {
        return airlines[airline].isFunded;
    }

    function getRegisteredAirlines() external view returns(address[] memory) {
        return registeredAirlines;
    }

    function authorizeCaller(address contractAddress) external requireContractOwner {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeCaller(address contractAddress) external requireContractOwner {
        delete authorizedContracts[contractAddress];
    }

    function isFlight(address airline, string calldata flight, uint256 timestamp) external view returns(bool) {
        return flights[getFlightKey(airline, flight, timestamp)].isRegistered;
    }

    function isLandedFlight(address airline, string calldata flight, uint256 timestamp) external view returns(bool) {
        return flights[getFlightKey(airline, flight, timestamp)].statusCode > STATUS_CODE_UNKNOWN;
    }


    function isInsured(address passenger, address airline, string calldata flight, uint256 timestamp) external view returns (bool) {
        Insurance[] memory insuredPassengers = insuredPassengersPerFlight[getFlightKey(airline, flight, timestamp)];
        for(uint i = 0; i < insuredPassengers.length; i++) {
        if (insuredPassengers[i].passenger == passenger) {
            return true;
        }
        }
      return false;
    }
  
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(string memory airlineName, address airlineAddress) public
    requireIsOperational requireIsCallerAuthorized
    returns(bool success)
    {
        bool result = true;
        require(airlines[airlineAddress].isRegistered == false, "Airline has already been registered");
        airlines[airlineAddress] = Airline({
          name: airlineName,
          isFunded: false,
          isRegistered: true,
          flightKeys: new bytes32[](0)
        });

        registeredAirlines.push(airlineAddress);
        emit AirlineRegistered(airlineName, airlineAddress);
        return result;
    }

    function fundAirline(address addr) external requireIsOperational requireIsCallerAuthorized {
      airlines[addr].isFunded = true;
      emit AirlineFunded(airlines[addr].name, addr);
    }

    /**
     * @dev Register a flight
     */
    function registerFlight(address airline, string calldata name, uint256 timestamp) external
    requireIsOperational requireIsCallerAuthorized requireAirlineIsFunded(airline) {
        bytes32 flightKey = getFlightKey(airline, name, timestamp);
        require(!flights[flightKey].isRegistered, "Flight has already been registered");

        flights[flightKey] = Flight({
        isRegistered: true,
        statusCode: 0,
        departure: timestamp,
        airline: airline,
        name: name
        });

    registeredFlights.push(flightKey);
    emit FlightRegistered(flightKey, airline, name, timestamp);
   }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                address airline, string calldata flight, uint256 timestamp,
                                address passenger, uint256 amount, uint256 multiplier
                            )
                            external requireIsOperational requireIsCallerAuthorized
                            payable
    {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);

    insuredPassengersPerFlight[flightKey].push(Insurance({
      airline: airline,
      passenger: passenger,
      amount: amount,
      multiplier: multiplier,
      isCredited: false
    }));

    emit InsuranceBought(airline, flight, timestamp, passenger, amount, multiplier);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(address airline, string memory flight, uint256 timestamp)
    internal requireIsOperational requireIsCallerAuthorized
    {
            bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        for (uint i = 0; i < insuredPassengersPerFlight[flightKey].length; i++) {
            Insurance memory insurance = insuredPassengersPerFlight[flightKey][i];
            if (insurance.isCredited == false) {
                insurance.isCredited = true;
                uint256 amount = insurance.amount.mul(insurance.multiplier).div(100);
                pendingPayments[insurance.passenger] += amount;

                emit InsureeCredited(insurance.passenger, amount);
            }
        }
    }

    /**
    * @dev Process flights
    */
    function processFlightStatus(address airline, string calldata flight, uint256 timestamp, uint8 statusCode)
    external requireIsOperational requireIsCallerAuthorized {
        //require(!this.isLandedFlight(airline, flight, timestamp), "Flight already landed");

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        if (flights[flightKey].statusCode == STATUS_CODE_UNKNOWN) {
        flights[flightKey].statusCode = statusCode;
            if(statusCode == STATUS_CODE_LATE_AIRLINE) {
                creditInsurees(airline, flight, timestamp);
            }
        }

        emit FlightStatusUpdated(airline, flight, timestamp, statusCode);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
  function pay(address passenger) external requireIsOperational requireIsCallerAuthorized {
    // Checks
        require(passenger == msg.sender, "Contracts can only pay to the passenger. ");
        require(pendingPayments[passenger] > 0, "No fund available for withdrawal. ");

        uint256 amount = pendingPayments[passenger];
        pendingPayments[passenger] = 0;

        address(uint160(passenger)).transfer(amount);

        emit AccountWithdrawn(passenger, amount);
    }
   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund(address _sender) public payable
    {
        airlines[_sender].isFunded = true;
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable
    {
       // fund();
    }


}