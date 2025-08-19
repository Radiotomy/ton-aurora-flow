import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type PaymentContractConfig = {
    seqno: number;
    owner: Address;
    fee_percentage: number; // in basis points (100 = 1%)
};

export function paymentContractConfigToCell(config: PaymentContractConfig): Cell {
    return beginCell()
        .storeUint(config.seqno, 32)
        .storeAddress(config.owner)
        .storeUint(config.fee_percentage, 16)
        .endCell();
}

export class PaymentContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new PaymentContract(address);
    }

    static createFromConfig(config: PaymentContractConfig, code: Cell, workchain = 0) {
        const data = paymentContractConfigToCell(config);
        const init = { code, data };
        return new PaymentContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTip(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            recipient: Address;
            message?: string;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x01, 32) // tip opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.recipient)
                .storeStringTail(opts.message ?? '')
                .endCell(),
        });
    }

    async sendPayment(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            recipient: Address;
            paymentType: 'nft_purchase' | 'fan_club_membership';
            itemId?: string;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x02, 32) // payment opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.recipient)
                .storeStringTail(opts.paymentType)
                .storeStringTail(opts.itemId ?? '')
                .endCell(),
        });
    }

    async getBalance(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_balance', []);
        return result.stack.readBigNumber();
    }

    async getOwner(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('get_owner', []);
        return result.stack.readAddress();
    }

    async getFeePercentage(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_fee_percentage', []);
        return result.stack.readNumber();
    }

    async getSeqno(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_seqno', []);
        return result.stack.readNumber();
    }
}