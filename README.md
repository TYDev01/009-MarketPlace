# 009-MarketPlace

A fully-featured NFT marketplace smart contract built on the Stacks blockchain with automated royalty distribution.

## 🚀 Features

- **NFT Minting**: Create NFTs with custom metadata and royalty settings
- **Marketplace Listing**: List NFTs for sale with configurable prices
- **Dynamic Pricing**: Update listing prices at any time
- **Listing Management**: Cancel listings when needed
- **Automated Royalties**: Automatic royalty distribution to creators on every sale
- **Ownership Verification**: Built-in ownership and authorization checks
- **Query Functions**: Read-only functions for marketplace data

## 📋 Contract Functions

### Public Functions

- `mint(uri, royalty-bps)` - Mint a new NFT with metadata and royalty percentage
- `list-token(token-id, price)` - List an NFT for sale
- `update-listing(token-id, new-price)` - Update the price of a listed NFT
- `cancel-listing(token-id)` - Remove an NFT from the marketplace
- `purchase(token-id)` - Buy a listed NFT with automatic royalty distribution

### Read-Only Functions

- `get-last-token-id()` - Get the most recently minted token ID
- `get-token-metadata(token-id)` - Retrieve NFT metadata
- `get-listing(token-id)` - Get listing information for an NFT
- `get-owner(token-id)` - Get the current owner of an NFT

## 💰 Royalty System

The contract uses a basis points system for precise royalty calculations:
- `10000 BPS = 100%`
- `500 BPS = 5%`
- `100 BPS = 1%`

Royalties are automatically distributed on each purchase, with the creator receiving their percentage and the seller receiving the remainder.

## 🧪 Testing

Comprehensive test suite with 21 tests covering:
- Minting functionality (3 tests)
- Listing operations (3 tests)
- Listing updates (3 tests)
- Listing cancellations (2 tests)
- Purchase flow with royalties (4 tests)
- Read-only queries (5 tests)
- End-to-end integration (1 test)

**Run tests:**
```bash
npm test
```

**Test Results:** ✅ 21/21 passing (100%)

## 🌐 Deployment

### Testnet
- **Contract Address:** `ST2S0QHZC65P50HFAA2P7GD9CJBT48KDJ9DNYGDSK.nftmarketplace`
- **Network:** Stacks Testnet
- **Deployment Cost:** 0.059920 STX
- **Status:** ✅ Live

### Deploy to Testnet
```bash
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet
```

## 🛠️ Development

### Prerequisites
- Clarinet
- Node.js
- npm

### Setup
```bash
# Clone the repository
git clone https://github.com/TYDev01/009-MarketPlace.git
cd 009-MarketPlace

# Install dependencies
npm install

# Run tests
npm test

# Check contract syntax
clarinet check
```



## 🔒 Security Features

- Ownership validation on all token operations
- Authorization checks for listing modifications
- Self-purchase prevention
- Zero-price listing rejection
- Invalid royalty percentage rejection (>100%)

## 📝 License

MIT