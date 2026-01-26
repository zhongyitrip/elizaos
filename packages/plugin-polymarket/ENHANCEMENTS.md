# Polymarket Plugin Enhancements

> 🚀 **Enhanced Fork**: Additional features not available in upstream ElizaOS

## Added Features

### P0 - Critical Additions

#### 1. Order Cancellation
- ✅ `cancelOrder` - Cancel single order via CLOB API

**Usage**:
```
"Cancel order 0x1234567890abcdef..."
"Revoke my order abc123def456"
```

#### 2. Position Tracking
- ✅ `getPositions` - Query user positions and holdings via Data API

**Usage**:
```
"Show me my positions"
"What tokens do I hold?"
"Check my holdings"
```

## Implementation Details

### Data API Client
Added `DataApiClient` utility to interact with `https://data-api.polymarket.com`, enabling access to:
- User positions (`/positions`)
- Trade activity (`/activity`)

### Template Enhancements
- Added `cancelOrderTemplate` for extracting order IDs
- Added `getPositions` pattern matching (no template needed as it uses wallet address)

## Installation

This enhanced version relies on the standard configuration:

```env
CLOB_API_URL=https://clob.polymarket.com
# One of the following private keys is required for positions/trading:
POLYMARKET_PRIVATE_KEY=your_key
WALLET_PRIVATE_KEY=your_key
```

## Contributing

Found a bug or want to add more features? Submit a PR to `feature/polymarket-enhancements` branch.
