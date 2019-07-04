pragma solidity >=0.4.21 <0.6.0;

import "./ERC721Mintable.sol";
import "./Verifier.sol";

// DONE define a contract call to the zokrates generated solidity contract <Verifier> or <renamedVerifier>

// DONE define another contract named SolnSquareVerifier that inherits from your ERC721Mintable class
contract SolnSquareVerifier is MyCustomERC721Token {

Verifier verifier;

// DONE define a solutions struct that can hold an index & an address
struct Solution {
    uint256 index;
    address solutionAddress;
}

// DONE define an array of the above struct
Solution[] solutions;

// DONE define a mapping to store unique solutions submitted
mapping(uint256 => Solution) submittedSolutions;

function getSolutions() external view returns(uint256){
    return solutions.length;
}

// DONE Create an event to emit when a solution is added
event SolutionAdded(uint256 solutionIndex, address solutionAddress);
event TokenMinted(address to, uint256 tokenId);

constructor(address verifierAddress, string memory name, string memory symbol) MyCustomERC721Token(name, symbol) public {
        verifier = Verifier(verifierAddress);
}

// DONE Create a function to add the solutions to the array and emit the event
function addSolution(address to,
            uint[2] memory a,
            uint[2] memory a_p,
            uint[2][2] memory b,
            uint[2] memory b_p,
            uint[2] memory c,
            uint[2] memory c_p,
            uint[2] memory h,
            uint[2] memory k,
            uint[2] memory input) public {

    require(!solutionExist(a, a_p, b, b_p, c, c_p, h, k, input), "Solution already exist.");
    require(verifier.verifyTx(a, a_p, b, b_p, c, c_p, h, k, input), "Solution verfication failed. ");

    uint256 hashIndex = hashOfSolution(a, a_p, b, b_p, c, c_p, h, k, input);
    solutions.push(Solution({index: hashIndex, solutionAddress: to}));

    submittedSolutions[hashIndex] = Solution({index: hashIndex, solutionAddress: to});

    emit SolutionAdded(hashIndex, to);
}

function solutionExist(uint[2] memory a,
            uint[2] memory a_p,
            uint[2][2] memory b,
            uint[2] memory b_p,
            uint[2] memory c,
            uint[2] memory c_p,
            uint[2] memory h,
            uint[2] memory k,
            uint[2] memory input) internal view returns(bool){
    bool unique = true;
    uint256 hashIndex = hashOfSolution(a, a_p, b, b_p, c, c_p, h, k, input);
    if(submittedSolutions[hashIndex].solutionAddress == address(0)){
        unique = false;
    }
    return unique;
}

function hashOfSolution(uint[2] memory a,
            uint[2] memory a_p,
            uint[2][2] memory b,
            uint[2] memory b_p,
            uint[2] memory c,
            uint[2] memory c_p,
            uint[2] memory h,
            uint[2] memory k,
            uint[2] memory input) internal pure returns (uint256){
    return uint(keccak256(abi.encodePacked(a, a_p, b, b_p, c, c_p, h, k, input)));
}


// DONE Create a function to mint new NFT only after the solution has been verified
//  - make sure the solution is unique (has not been used before)
//  - make sure you handle metadata as well as tokenSuplly
function mintToken(address to, uint256 tokenId,
                        uint[2] memory a,
            uint[2] memory a_p,
            uint[2][2] memory b,
            uint[2] memory b_p,
            uint[2] memory c,
            uint[2] memory c_p,
            uint[2] memory h,
            uint[2] memory k,
                        uint[2] memory input) public{

    require(verifier.verifyTx(a, a_p, b, b_p, c, c_p, h, k, input), "Solution verification failed. ");
    require(!solutionExist(a, a_p, b, b_p, c, c_p, h, k, input), "Solution already exists.");

    addSolution(to, a, a_p, b, b_p, c, c_p, h, k, input);

    super.mint(to, tokenId);

    emit TokenMinted(to, tokenId);
    }
}

























