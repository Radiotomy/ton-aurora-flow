import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type NFTCollectionConfig = {
    owner: Address;
    next_item_index: number;
    content: Cell;
    nft_item_code: Cell;
    royalty_params: Cell;
};

export function nftCollectionConfigToCell(config: NFTCollectionConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeUint(config.next_item_index, 64)
        .storeRef(config.content)
        .storeRef(config.nft_item_code)
        .storeRef(config.royalty_params)
        .endCell();
}

export class NFTCollectionContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NFTCollectionContract(address);
    }

    static createFromConfig(config: NFTCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NFTCollectionContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMintNft(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId?: number;
            itemIndex: number;
            itemOwner: Address;
            itemContent: Cell;
            amount: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32) // mint opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeUint(opts.itemIndex, 64)
                .storeCoins(opts.amount)
                .storeRef(
                    beginCell()
                        .storeAddress(opts.itemOwner)
                        .storeRef(opts.itemContent)
                        .endCell()
                )
                .endCell(),
        });
    }

    async sendBatchMint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryId?: number;
            items: Array<{
                itemIndex: number;
                itemOwner: Address;
                itemContent: Cell;
                amount: bigint;
            }>;
        }
    ) {
        const deployList = beginCell();
        for (const item of opts.items) {
            const nftMessage = beginCell()
                .storeAddress(item.itemOwner)
                .storeRef(item.itemContent)
                .endCell();
                
            deployList.storeRef(
                beginCell()
                    .storeUint(item.itemIndex, 64)
                    .storeCoins(item.amount)
                    .storeRef(nftMessage)
                    .endCell()
            );
        }

        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(2, 32) // batch_mint opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeRef(deployList.endCell())
                .endCell(),
        });
    }

    async sendChangeOwner(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            newOwner: Address;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(3, 32) // change_owner opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.newOwner)
                .endCell(),
        });
    }

    async getCollectionData(provider: ContractProvider): Promise<{
        nextItemIndex: bigint;
        content: Cell;
        owner: Address;
    }> {
        const result = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: result.stack.readBigNumber(),
            content: result.stack.readCell(),
            owner: result.stack.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number): Promise<Address> {
        const result = await provider.get('get_nft_address_by_index', [{ type: 'int', value: BigInt(index) }]);
        return result.stack.readAddress();
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<{
        numerator: number;
        denominator: number;
        destination: Address;
    }> {
        const result = await provider.get('royalty_params', []);
        return {
            numerator: result.stack.readNumber(),
            denominator: result.stack.readNumber(),
            destination: result.stack.readAddress(),
        };
    }

    async getNftContent(provider: ContractProvider, index: number, individualContent: Cell): Promise<Cell> {
        const result = await provider.get('get_nft_content', [
            { type: 'int', value: BigInt(index) },
            { type: 'cell', cell: individualContent },
        ]);
        return result.stack.readCell();
    }
}