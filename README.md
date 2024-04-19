```plaintext
# NFT Contract

This is an ERC721 (NFT) contract. It is Ownable and protected from reentrancy attack. 
It allows users to buy NFTs using various methods:


1. Minting a fixed amount of tokens (up to a maximum of 3) at once.
    It also possible using signature for minting.
2. Minting a set of NFTs, which contains 6 NFTs (can be minted only once).

## Contract Details

- **Maximum Tokens**: The maximum number of NFTs that can be minted is set to 1000.
- **Maximum Mint Amount**: Users can mint up to 3 NFTs at a time.
- **Set Size**: Sets contain 6 NFTs.
- **Prices**: The price(in wei) for minting a single NFT and a set of NFTs(can be set by the owner).

## Functions

### Minting

#### `mint(uint _amount) external payable`

Allows users to mint NFTs. Users specify the amount they want to mint, and the payment must match the total price.

#### `signedMint(uint256 _amount, uint256 nonce, bytes memory _signature) external`

Allows users to mint NFTs using a signature provided by the backend. This method ensures the integrity and authenticity of the minting process.

#### `mintSet() external payable`

Allows users to mint a set of NFTs, which contains 6 NFTs. Users can only mint one set.

### Admin Functions

#### `setPrices(uint256 _tokenPrice, uint256 _setPrice) external onlyOwner`

Allows the owner to set the prices for minting a single NFT and a set of NFTs.

#### `setBackendAddress(address _backendAddress) external onlyOwner`

Allows the owner to change the backend address used for signature verification.

#### `withdraw() external onlyOwner`

Allows the owner to withdraw the balance of the contract.


```
