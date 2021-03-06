// migrating the appropriate contracts
var Verifier = artifacts.require("./Verifier.sol");
var SolnSquareVerifier = artifacts.require("./SolnSquareVerifier.sol");
var MyCustomERC721Token = artifacts.require("MyCustomERC721Token");

module.exports = function(deployer, network, accounts) {

  if(network == "rinkeby"){

    deployer.deploy(Verifier, {from: accounts[0]})
    .then(() => {
      return deployer.deploy(SolnSquareVerifier, Verifier.address, "SquareVerifier", "SVT", {from: accounts[0]})
      .then(() => {
          // let config = {
          //   localhost: {
          //     url: 'http://localhost:8545',
          //     dataAddress: Verifier.address,
          //     appAddress: SolnSquareVerifier.address
          //   }
          // }
      });
    });

  } else if (network == "development") {

    deployer.deploy(MyCustomERC721Token, "RealEstate", "RET", {from: accounts[0]});

    deployer.deploy(Verifier, {from: accounts[0]})
    .then(() => {
      deployer.deploy(SolnSquareVerifier, Verifier.address, "SquareVerifier", "SVT", {from: accounts[0]})
      .then(() => {
          // let config = {
          //   localhost: {
          //     url: 'http://localhost:8545',
          //     dataAddress: Verifier.address,
          //     appAddress: SolnSquareVerifier.address
          //   }
          // }
      });
    });

  }
};
