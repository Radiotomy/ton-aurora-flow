import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type NFTContractConfig = {
    owner: Address;
    collection_address: Address;
    item_index: number;
    content: Cell;
};

export function nftContractConfigToCell(config: NFTContractConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeAddress(config.collection_address)
        .storeUint(config.item_index, 64)
        .storeRef(config.content)
        .endCell();
}

export class NFTContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NFTContract(address);
    }

    static createFromConfig(config: NFTContractConfig, code: Cell, workchain = 0) {
        const data = nftContractConfigToCell(config);
        const init = { code, data };
        return new NFTContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            newOwner: Address;
            responseAddress?: Address;
            queryId?: number;
            fwdAmount?: bigint;
            fwdPayload?: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x5fcc3d14, 32) // transfer opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.newOwner)
                .storeAddress(opts.responseAddress ?? null)
                .storeBit(false) // null custom_payload
                .storeCoins(opts.fwdAmount ?? 0)
                .storeMaybeRef(opts.fwdPayload)
                .endCell(),
        });
    }

    async sendGetStaticData(provider: ContractProvider, via: Sender, opts: { queryId?: number }) {
        await provider.internal(via, {
            value: 50000000n, // 0.05 TON
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2fcb26a2, 32) // get_static_data opcode
                .storeUint(opts.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async getOwner(provider: ContractProvider): Promise<Address | null> {
        try {
            const result = await provider.get('get_nft_data', []);
            const init = result.stack.readBoolean();
            if (!init) return null;
            
            result.stack.readNumber(); // index
            result.stack.readAddress(); // collection
            return result.stack.readAddress(); // owner
        } catch {
            return null;
        }
    }

    async getNftData(provider: ContractProvider): Promise<{
        init: boolean;
        index: number;
        collection: Address | null;
        owner: Address | null;
        content: Cell;
    } | null> {
        try {
            const result = await provider.get('get_nft_data', []);
            return {
                init: result.stack.readBoolean(),
                index: result.stack.readNumber(),
                collection: result.stack.readAddressOpt(),
                owner: result.stack.readAddressOpt(),
                content: result.stack.readCell(),
            };
        } catch {
            return null;
        }
    }
}