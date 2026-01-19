import { Plugin } from "@elizaos/core";
import { getWalletPortfolioAction } from "./actions/getWalletPortfolio";
import { getWalletPositionsAction } from "./actions/getWalletPositions";
import { getWalletPositionsByChainAction } from "./actions/getWalletPositionsByChain";

export const zerionEnhancedPlugin: Plugin = {
    name: "zerion-enhanced",
    description: "Enhanced Zerion plugin with detailed token information and chain filtering",
    actions: [
        getWalletPortfolioAction,
        getWalletPositionsAction,
        getWalletPositionsByChainAction,
    ],
    evaluators: [],
    providers: [],
};

export default zerionEnhancedPlugin;
