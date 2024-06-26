const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT", function() {
  let token: any;
  let owner: any;
  let backend: any;
  let user1: any;
  let user2: any;
  beforeEach(async function () {  

    [owner, backend, user1, user2] = await ethers.getSigners();
    
    const NFT = await ethers.getContractFactory("NFT", owner);
    token = await NFT.deploy(100, 500, backend, owner, "NFT token", "NFT");
    await token.waitForDeployment();

  });

  describe("Initialization", function () {
    it("Shuld be deployed with correct args!", async function() {
      expect(await token.name()).to.eq("NFT token");
      expect(await token.symbol()).to.eq("NFT");
      expect(await token.owner()).to.eq(owner.address);
      expect(await token.tokenPrice()).to.eq(100);
      expect(await token.setPrice()).to.eq(500);
    });
  });

  describe("Mint with signature", function () {
    it("Should be possible to mint with correct signature!", async function () {
      const nonce = 1;
      const amount = 2;
      const hash = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'uint256'],
        [user1.address, amount, nonce]
      );
      const signature = await backend.signMessage(ethers.toBeArray(hash));
      
      await token.connect(user1).signedMint(amount, nonce, signature);
      expect(await token.balanceOf(user1.address)).to.eq(amount);
    });

    describe("Reverts", function () {
      it("Should not be possible to mint if the signature try to use second time!", async function () {
        const nonce = 1;
        const amount = 2;
        const hash = ethers.solidityPackedKeccak256(
          ['address', 'uint256', 'uint256'],
          [user1.address, amount, nonce]
        );
        const signature = await backend.signMessage(ethers.toBeArray(hash));
        
        await token.connect(user1).signedMint(amount, nonce, signature);
        const tx = token.connect(user1).signedMint(amount, nonce, signature);
  
        await expect(tx).to.be.revertedWith("NFT: Signature already used");
      });
  
      it("Should not be possible to mint if the amount is incorrect!", async function () {
        const nonce = 1;
        const amount = 4;
        const hash = ethers.solidityPackedKeccak256(
          ['address', 'uint256', 'uint256'],
          [user1.address, amount, nonce]
        );
        const signature = await backend.signMessage(ethers.toBeArray(hash));
        
        const tx = token.connect(user1).signedMint(amount, nonce, signature);
  
        await expect(tx).to.be.revertedWith("NFT: Incorrect amount");
      });
  
      it("Should not be possible to mint if token limit reached!", async function () {
        const nonce = 1;
        const amount = 2;
        const hash = ethers.solidityPackedKeccak256(
          ['address', 'uint256', 'uint256'],
          [user1.address, amount, nonce]
        );
        const signature = await backend.signMessage(ethers.toBeArray(hash));
        await token.setTokenId(999);
        
        const tx = token.connect(user1).signedMint(amount, nonce, signature);
        await expect(tx).to.be.revertedWith("NFT: Token limit reached");
      });

      it("Should not be possible to mint if something wrong with signature!", async function () {
        const nonce = 1;
        const amount = 2;
        const hash = ethers.solidityPackedKeccak256(
          ['address', 'uint256', 'uint256'],
          [user1.address, amount, nonce]
        );
        const signature = await backend.signMessage(ethers.toBeArray(hash));
        
        let tx = token.connect(user1).signedMint(amount + 1, nonce, signature);
        await expect(tx).to.be.revertedWith("NFT: Invalid signature");

        tx = token.connect(user1).signedMint(amount, nonce + 1, signature);
        await expect(tx).to.be.revertedWith("NFT: Invalid signature");

        tx = token.connect(user2).signedMint(amount, nonce, signature);
        await expect(tx).to.be.revertedWith("NFT: Invalid signature");
      });
    });

    describe("Events", function () {
      it("Should be emited with correct args!", async function () {
        const nonce = 1;
        const amount = 2;
        const hash = ethers.solidityPackedKeccak256(
          ['address', 'uint256', 'uint256'],
          [user1.address, amount, nonce]
        );
        const signature = await backend.signMessage(ethers.toBeArray(hash));

        let tx = token.connect(user1).signedMint(amount, nonce, signature);
        await expect(tx)
          .to.emit(token, "Minted")
          .withArgs(1, user1.address)
          .to.emit(token, "Minted")
          .withArgs(2, user1.address)
      });
    });
    
  });

  describe("Mint", function () {
    it("Should be possible to mint NFT!", async function () {
      const amount = 2;
      const tx = await token.connect(user1).mint(amount, {value: 200});
      
      await expect(tx).changeEtherBalances([user1, token], [-200, 200])
      expect(await token.balanceOf(user1.address)).to.eq(amount);
    });

    describe("Reverts", function () {
      it("Should not be possible to buy NFT if amount is incorrect!", async function () {
        const amount = 4;

        const tx = token.connect(user1).mint(amount, {value: 200});
        await expect(tx).to.be.revertedWith("NFT: Incorrect amount");
      });

      it("Should not be possible to buy NFT if the payment is not enough! ", async function () {
        const amount = 2;

        const tx = token.connect(user1).mint(amount, {value: 199});
        await expect(tx).to.be.revertedWith("NFT: Insufficient payment");
      });

      it("Should not be possible to buy NFT if token limit reached! ", async function () {
        const amount = 2;
        await token.setTokenId(999);

        const tx = token.connect(user1).mint(amount, {value: 200});
        await expect(tx).to.be.revertedWith("NFT: Token limit reached");
      });
    });

    describe("Events", function () {
      it("Should be emited with correct args!", async function () {
        const amount = 2;

        const tx = token.connect(user1).mint(amount, {value: 200});
        await expect(tx)
          .to.emit(token, "Minted")
          .withArgs(1, user1.address)
          .to.emit(token, "Minted")
          .withArgs(2, user1.address)
      });
    });
  });

  describe("mintSet", function () {
    it("Should be possible to mint set of NFTs!", async function () {
      const tx = await token.connect(user1).mintSet({value: 600});
      
      await expect(tx).changeEtherBalances([user1, token], [-500, 500])
      expect(await token.balanceOf(user1.address)).to.eq(6);
    });

    describe("Reverts", function () {
      it("Should not be possible to buy NFT if the payment is not enough! ", async function () {
        const tx = token.connect(user1).mintSet({value: 499});
        await expect(tx).to.be.revertedWith("NFT: Insufficient payment");
      });
      
      it("Should not be possible to buy NFT if the user already bought once!", async function () {
        await token.connect(user1).mintSet({value: 500});
        const tx = token.connect(user1).mintSet({value: 500});
        await expect(tx).to.be.revertedWith("NFT: Already minted a set");
      });

      it("Should not be possible to buy NFT if token limit reached! ", async function () {
        await token.setTokenId(995);

        const tx = token.connect(user1).mintSet({value: 500});
        await expect(tx).to.be.revertedWith("NFT: Token limit reached");
      });
    });

    describe("Events", function () {
      it("Should be emited with correct args!", async function () {
        const tx = token.connect(user1).mintSet({value: 600});

        await expect(tx)
          .to.emit(token, "SetMinted")
          .withArgs([1, 2, 3, 4, 5, 6], user1.address)
      });
    });
  });

  describe("Withdraw", function () {
    it("Should be possible to withdraw funds!", async function () {
      await token.connect(user1).mintSet({value: 600});
      await token.connect(user1).mint(2, {value: 200});

      const tx = await token.withdraw();
      await expect(tx).changeEtherBalances([token, owner], [-700, 700])
    });

    describe("Reverts", function () {
      it("Should not be possible to withdraw if the caller is not an owner!", async function () {
        const tx = token.connect(user1).withdraw();
        await expect(tx).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      });
    });
  });

});