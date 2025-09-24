//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
// Opcional: si querés, podés importar StdChains, pero acá resolvemos con mapping local
// import {StdChains, Chain} from "forge-std/StdChains.sol";

contract ScaffoldETHDeploy is Script {
    error InvalidChain();
    error DeployerHasNoBalance();
    error InvalidPrivateKey(string);

    event AnvilSetBalance(address account, uint256 amount);
    event FailedAnvilRequest();

    struct Deployment {
        string name;
        address addr;
    }

    string root;
    string path;
    Deployment[] public deployments;
    uint256 constant ANVIL_BASE_BALANCE = 10000 ether;

    /// @notice The deployer address for every run
    address deployer;

    /// @notice Use this modifier on your run() function on your deploy scripts
    modifier ScaffoldEthDeployerRunner() {
        deployer = _startBroadcast();
        if (deployer == address(0)) revert InvalidPrivateKey("Invalid private key");
        _;
        _stopBroadcast();
        exportDeployments();
    }

    function _startBroadcast() internal returns (address) {
        vm.startBroadcast();
        (, address _deployer,) = vm.readCallers();

        // Si estás en Anvil (31337) y la cuenta no tiene balance, dale fondos con vm.deal
        if (block.chainid == 31337 && _deployer.balance == 0) {
            // vm.deal no suele revertir; mantenemos el emit por compatibilidad
            vm.deal(_deployer, ANVIL_BASE_BALANCE);
            emit AnvilSetBalance(_deployer, ANVIL_BASE_BALANCE);
        }

        return _deployer;
    }

    function _stopBroadcast() internal {
        vm.stopBroadcast();
    }

    function exportDeployments() internal {
        // fetch already existing contracts
        root = vm.projectRoot();
        path = string.concat(root, "/deployments/");
        string memory chainIdStr = vm.toString(block.chainid);
        path = string.concat(path, string.concat(chainIdStr, ".json"));

        string memory jsonWrite;
        uint256 len = deployments.length;
        for (uint256 i = 0; i < len; i++) {
            vm.serializeString(jsonWrite, vm.toString(deployments[i].addr), deployments[i].name);
        }

        // networkName
        string memory chainName = _chainNameOrFallback();
        jsonWrite = vm.serializeString(jsonWrite, "networkName", chainName);

        vm.writeJson(jsonWrite, path);
    }

    /// @dev Primero intenta por mapping conocido; si no, intenta detectar con forks configurados.
    function _chainNameOrFallback() internal returns (string memory) {
        string memory known = _knownChainName(block.chainid);
        if (bytes(known).length != 0) return known;
        return findChainName(); // fallback
    }

    /// @dev Mapeo minimal con redes más comunes; agregá las que uses.
    function _knownChainName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "mainnet";
        if (chainId == 137) return "polygon";
        if (chainId == 80002) return "polygon-amoy";
        if (chainId == 8453) return "base";
        if (chainId == 84532) return "base-sepolia";
        if (chainId == 10) return "optimism";
        if (chainId == 42161) return "arbitrum";
        if (chainId == 31337) return "anvil";
        return "";
    }

    /// @notice Intenta descubrir el nombre de red probando los RPCs configurados en foundry.toml
    /// @dev Esto NO usa address(this). vm.createSelectFork es un cheatcode externo y soporta try/catch.
    function findChainName() public returns (string memory) {
        uint256 thisChainId = block.chainid;
        string[2][] memory allRpcUrls = vm.rpcUrls();
        for (uint256 i = 0; i < allRpcUrls.length; i++) {
            try vm.createSelectFork(allRpcUrls[i][1]) {
                if (block.chainid == thisChainId) {
                    return allRpcUrls[i][0]; // nombre de la entrada en [rpc_endpoints]
                }
            } catch {
                // seguir intentando
            }
        }
        revert InvalidChain();
    }

    // ===== API pública para que tus deploy scripts registren contratos =====
    function _registerDeployment(string memory name, address addr) internal {
        deployments.push(Deployment({name: name, addr: addr}));
    }
}
