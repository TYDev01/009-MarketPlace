import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT_NAME = "nftmarketplace";

describe("NFT Marketplace Contract Tests", () => {
  
  describe("Minting", () => {
    it("should mint an NFT successfully", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "mint",
        [Cl.principal(wallet1), Cl.some(Cl.stringAscii("https://example.com/1")), Cl.uint(500)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should reject invalid royalty above 10000 BPS", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "mint",
        [Cl.principal(wallet1), Cl.none(), Cl.uint(10001)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-INVALID-ROYALTY
    });

    it("should allow minting with maximum royalty", () => {
      const before = simnet.callReadOnlyFn(CONTRACT_NAME, "get-last-token-id", [], deployer);
      const beforeId = Number(before.result.value);
      
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "mint",
        [Cl.principal(wallet1), Cl.none(), Cl.uint(10000)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(beforeId + 1));
    });
  });

  describe("Listing", () => {
    it("should allow owner to list NFT", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      expect(result).toBeOk(tokenId);
    });

    it("should prevent non-owner from listing", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet2);
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-OWNER
    });

    it("should reject zero price listing", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(0)], wallet1);
      expect(result).toBeErr(Cl.uint(104)); // ERR-INVALID-PRICE
    });
  });

  describe("Update Listing", () => {
    it("should allow seller to update price", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "update-listing", [tokenId, Cl.uint(2000000)], wallet1);
      expect(result).toBeOk(tokenId);
    });

    it("should prevent non-seller from updating", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "update-listing", [tokenId, Cl.uint(2000000)], wallet2);
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-OWNER
    });

    it("should reject updating unlisted token", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "update-listing", [tokenId, Cl.uint(2000000)], wallet1);
      expect(result).toBeErr(Cl.uint(105)); // ERR-NOT-LISTED
    });
  });

  describe("Cancel Listing", () => {
    it("should allow seller to cancel listing", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "cancel-listing", [tokenId], wallet1);
      expect(result).toBeOk(tokenId);
    });

    it("should prevent non-seller from canceling", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "cancel-listing", [tokenId], wallet2);
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-OWNER
    });
  });

  describe("Purchase", () => {
    it("should allow purchase with royalty distribution", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(250)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "purchase", [tokenId], wallet2);
      expect(result).toBeOk(tokenId);
      
      // Verify new owner
      const owner = simnet.callReadOnlyFn(CONTRACT_NAME, "get-owner", [tokenId], wallet1);
      expect(owner.result).toBeSome(Cl.principal(wallet2));
    });

    it("should handle creator selling own NFT", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(deployer), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], deployer);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "purchase", [tokenId], wallet1);
      expect(result).toBeOk(tokenId);
    });

    it("should prevent self-purchase", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(1000000)], wallet1);
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "purchase", [tokenId], wallet1);
      expect(result).toBeErr(Cl.uint(106)); // ERR-SELF-PURCHASE
    });

    it("should reject purchasing unlisted token", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      
      const { result } = simnet.callPublicFn(CONTRACT_NAME, "purchase", [tokenId], wallet2);
      expect(result).toBeErr(Cl.uint(105)); // ERR-NOT-LISTED
    });
  });

  describe("Read-Only Functions", () => {
    it("should return correct last token ID", () => {
      const before = simnet.callReadOnlyFn(CONTRACT_NAME, "get-last-token-id", [], wallet1);
      const beforeId = Number(before.result.value);
      
      simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      
      const after = simnet.callReadOnlyFn(CONTRACT_NAME, "get-last-token-id", [], wallet1);
      expect(after.result).toBeUint(beforeId + 1);
    });

    it("should return token metadata", () => {
      const mint = simnet.callPublicFn(
        CONTRACT_NAME,
        "mint",
        [Cl.principal(wallet1), Cl.some(Cl.stringAscii("https://test.com/nft")), Cl.uint(750)],
        deployer
      );
      const tokenId = mint.result.value;
      
      const { result } = simnet.callReadOnlyFn(CONTRACT_NAME, "get-token-metadata", [tokenId], wallet1);
      expect(result).toBeSome(
        Cl.tuple({
          uri: Cl.some(Cl.stringAscii("https://test.com/nft")),
          creator: Cl.principal(deployer),
          "royalty-bps": Cl.uint(750)
        })
      );
    });

    it("should return listing information", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet1), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(3000000)], wallet1);
      
      const { result } = simnet.callReadOnlyFn(CONTRACT_NAME, "get-listing", [tokenId], wallet1);
      expect(result).toBeSome(
        Cl.tuple({
          price: Cl.uint(3000000),
          seller: Cl.principal(wallet1)
        })
      );
    });

    it("should return NFT owner", () => {
      const mint = simnet.callPublicFn(CONTRACT_NAME, "mint", [Cl.principal(wallet3), Cl.none(), Cl.uint(500)], deployer);
      const tokenId = mint.result.value;
      
      const { result } = simnet.callReadOnlyFn(CONTRACT_NAME, "get-owner", [tokenId], wallet1);
      expect(result).toBeSome(Cl.principal(wallet3));
    });

    it("should return none for non-existent token", () => {
      const { result } = simnet.callReadOnlyFn(CONTRACT_NAME, "get-owner", [Cl.uint(999999)], wallet1);
      expect(result).toBeNone();
    });
  });

  describe("Integration", () => {
    it("should handle complete marketplace flow", () => {
      // Mint
      const mint = simnet.callPublicFn(
        CONTRACT_NAME,
        "mint",
        [Cl.principal(wallet1), Cl.some(Cl.stringAscii("https://example.com/full-test")), Cl.uint(250)],
        deployer
      );
      const tokenId = mint.result.value;
      expect(mint.result).toBeOk(tokenId);
      
      // List
      const list = simnet.callPublicFn(CONTRACT_NAME, "list-token", [tokenId, Cl.uint(5000000)], wallet1);
      expect(list.result).toBeOk(tokenId);
      
      // Update price
      const update = simnet.callPublicFn(CONTRACT_NAME, "update-listing", [tokenId, Cl.uint(4000000)], wallet1);
      expect(update.result).toBeOk(tokenId);
      
      // Purchase
      const purchase = simnet.callPublicFn(CONTRACT_NAME, "purchase", [tokenId], wallet2);
      expect(purchase.result).toBeOk(tokenId);
      
      // Verify owner changed
      const owner = simnet.callReadOnlyFn(CONTRACT_NAME, "get-owner", [tokenId], wallet1);
      expect(owner.result).toBeSome(Cl.principal(wallet2));
      
      // Verify listing removed
      const listing = simnet.callReadOnlyFn(CONTRACT_NAME, "get-listing", [tokenId], wallet1);
      expect(listing.result).toBeNone();
    });
  });
});
