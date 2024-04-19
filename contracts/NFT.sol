// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * This is ERC721(NFT) contract
 * There you can buy NFT with some ways
 *      1. Fix amount for one time(maximum 3)
 *      2. Set, which contain 6 NFT(just once)
 */
contract NFT is ERC721, Ownable, ReentrancyGuard{
    uint256 public constant MAX_TOKENS = 1000; // The max amount of NFTs that can be
    uint256 public constant MAX_MINT_AMOUNT = 3; // The max amount of NFTs that can be minted for one time
    uint256 public constant SET_SIZE = 6; // The amount of NFT in set

    uint256 public tokenPrice; // The price for one NFT
    uint256 public setPrice; // The price for set
    uint256 private tokenId; // The current token id
    address private backendAddress; // The address of backend

    mapping(bytes => bool) private signedMinters; // To understand the signature was used or not
    mapping(address => bool) private hasMintedSet; // To understand the user has minted set or not

    event SetMinted(uint256[] tokenIds, address indexed owner); 
    event Minted(uint256 tokenId, address indexed owner);

    constructor (uint _tokenPrice, uint _setPrice, address _backendAddress, address _owner, string memory _name, string memory _symbol) ERC721(_name, _symbol) Ownable(_owner){
        tokenPrice = _tokenPrice;
        setPrice = _setPrice;
        backendAddress = _backendAddress;
    }
    
    /**
     * @dev This function allows to buy NFT 
     *      User can mint NFT:
     *          price: amount * tokenPrice(msg.value >= price)
     *      If the msg.value > price, the remaining amount will be transferd back to msg.sender
     * @param _amount the amount of tokens that must be minted(0 < amount <= 3)
     */
    function mint(uint _amount) external payable nonReentrant{
        require(_amount <= MAX_MINT_AMOUNT && _amount != 0, "NFT: Incorrect amount");
        uint price = tokenPrice * _amount;
        require(msg.value >= price, "NFT: Insufficient payment");
        require(tokenId + _amount <= MAX_TOKENS, "NFT: Token limit reached");

        for (uint i; i < _amount; ++i) {
            _safeMint(msg.sender, ++tokenId);
            emit Minted(tokenId, msg.sender);
        }
        
        if (msg.value > price) {
           (bool success, ) = msg.sender.call{value: msg.value - price}(""); 
           require(success, "NFT: Faild");
        }
    }

    /**
     * @dev This function allows to get NFT
     *      User can mint NFT if has the signature that must be signed by backend
     * @param _amount the amount of tokens that must be minted(0 < amount <= 3)
     * @param nonce indiviudal nonce for each signature
     * @param _signature the signature that must be signed by backend
     */
    function signedMint(uint256 _amount, uint256 nonce, bytes memory _signature) external {
        require(!signedMinters[_signature], "NFT: Signature already used");
        require(_amount <= MAX_MINT_AMOUNT && _amount != 0, "NFT: Incorrect amount");
        require(tokenId + _amount <= MAX_TOKENS, "NFT: Token limit reached");

        bytes32 message = keccak256(abi.encodePacked(msg.sender, _amount, nonce));
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(message);
        address recoveredAddress = ECDSA.recover(messageHash, _signature);
        
        require(recoveredAddress == backendAddress, "NFT: Invalid signature");


        for (uint i; i < _amount; ++i) {
            _safeMint(msg.sender, ++tokenId);
            emit Minted(tokenId, msg.sender);
        }

        signedMinters[_signature] = true;
    }

    /**
     * @dev This function allows to buy NFT
     *      User can mint the set of NFTs(just once):
     *          price: setPrise(msg.value >= setPrise)
     *      If the msg.value > setPrise, the remaining amount will be transferd back to msg.sender
     */
    function mintSet() external payable nonReentrant{
        require(msg.value >= setPrice, "NFT: Insufficient payment");
        require(!hasMintedSet[msg.sender], "NFT: Already minted a set");
        require(tokenId + SET_SIZE <= MAX_TOKENS, "NFT: Token limit reached");

        uint256[] memory tokenIds = new uint256[](SET_SIZE);

        for (uint256 i; i < SET_SIZE; ++i) {
            _safeMint(msg.sender, ++tokenId);
            tokenIds[i] = tokenId;
        }

        if (msg.value > setPrice) {
           (bool success, ) = msg.sender.call{value: msg.value - setPrice}(""); 
           require(success, "NFT: Faild");
        }

        hasMintedSet[msg.sender] = true;
        emit SetMinted(tokenIds, msg.sender);
    }
    
    /**
     * @dev This function allows the owner to change the current price of one NFT and NFTs set
     * @param _tokenPrice The new price for one NFT
     * @param _setPrice The new price for set of NFTs
     */
    function setPrices(uint256 _tokenPrice, uint256 _setPrice) external onlyOwner {
        tokenPrice = _tokenPrice;
        setPrice = _setPrice;
    }

    /**
     * @dev This function allows the owner to change the backend address
     * @param _backendAddress The new address for backend
     */
    function setBackendAddress(address _backendAddress) external onlyOwner {
        backendAddress = _backendAddress;
    }

    /**
     * @dev This function allows the owner to withdraw the balance of this contract
     */
    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "NFT: Faild");
    }

    /**
     * @dev This function should be deleted, declarated just for tests
     * @param _tokenId token Id
     */
    function setTokenId(uint256 _tokenId) external onlyOwner{
        tokenId = _tokenId;
    }
}
