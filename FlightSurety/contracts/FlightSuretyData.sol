pragma solidity >=0.4.25;

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
        Votes votes;
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

    struct Votes{
        uint votersCount;
        mapping(address => bool) voters;
    }

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
      flightKeys: new bytes32[](0),
      votes: Votes(0)
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

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires function caller to be authorized
    */
    modifier requireIsCallerAuthorized() {
     require(authorizedContracts[msg.sender] == 1, "Caller is not authorized");
     _;
    }

    /**
    * @dev Modifier that requires airline to be funded
    */
    modifier requireAirlineIsFunded(address airline) {
     require(airlines[airline].isFunded, "Only existing and funded airlines are allowed");
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


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(string memory airlineName, address airlineAddress)
    public requireIsOperational requireIsCallerAuthorized
    {
        require(!airlines[airlineAddress].isRegistered, "Airline has already been registered");
        airlines[airlineAddress] = Airline({
          name: airlineName,
          isFunded: false,
          isRegistered: true,
          flightKeys: new bytes32[](0),
          votes: Votes(0)
        });

        registeredAirlines.push(airlineAddress);
        emit AirlineRegistered(airlineName, airlineAddress);
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
    function creditInsurees
                                (
                                    address airline, string calldata flight, uint256 timestamp
                                )
                                external
                                pure
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
    function fund() public payable
    {
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
        fund();
    }


}

