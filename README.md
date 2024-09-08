# Lit Alpha Box

Lit Alpha Box is a decentralized application that harnesses the wisdom of crowds to generate collective predictions for cryptocurrency projects. Users submit encrypted predictions, mint NFTs in order to unlock aggregated insights.

Built for ETHGlobal 2024.

## Features

- Submit encrypted predictions for BTC, ETH, and Lit Protocol
- Unlock aggregated insights from all participants
- Secure encryption using Lit Protocol
- Integration with Supabase for data storage

## Technologies Used

- Lit Protocol
- Next.js
- Ethers.js
- Supabase
- OpenAI API

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run the development server: `npm run dev`

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
NEXT_PUBLIC_API_CIPHERTEXT=<your_api_ciphertext>
NEXT_PUBLIC_API_DATA_TO_ENCRYPT_HASH=<your_api_data_to_encrypt_hash>
```

## Usage

1. Connect your MetaMask wallet
2. Submit your prediction for BTC, ETH, and Lit Protocol
3. Mint an NFT
4. Unlock the aggregated alpha insights

## License

This project is licensed under the [MIT License](LICENSE).