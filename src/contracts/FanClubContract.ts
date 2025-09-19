import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type FanClubContractConfig = {
    owner: Address;
    artist_id: string;
    membership_price: bigint;
    max_supply: number;
    royalty_percentage: number;
};

export function fanClubContractConfigToCell(config: FanClubContractConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeStringTail(config.artist_id)
        .storeCoins(config.membership_price)
        .storeUint(config.max_supply, 32)
        .storeUint(config.royalty_percentage, 16)
        .endCell();
}

export class FanClubContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new FanClubContract(address);
    }

    static createFromConfig(config: FanClubContractConfig, code: Cell, workchain = 0) {
        const data = fanClubContractConfigToCell(config);
        const init = { code, data };
        return new FanClubContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendJoinMembership(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            member: Address;
            tier: string;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x01, 32) // join_membership opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.member)
                .storeStringTail(opts.tier)
                .endCell(),
        });
    }

    async sendUpdateMembership(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            member: Address;
            newTier: string;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x02, 32) // update_membership opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.member)
                .storeStringTail(opts.newTier)
                .endCell(),
        });
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            amount: bigint;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x03, 32) // withdraw opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeCoins(opts.amount)
                .endCell(),
        });
    }

    async getMembershipInfo(provider: ContractProvider, member: Address): Promise<{
        tier: string;
        joinedAt: number;
        isActive: boolean;
    }> {
        const result = await provider.get('get_membership_info', [
            { type: 'slice', cell: beginCell().storeAddress(member).endCell() }
        ]);
        return {
            tier: result.stack.readString(),
            joinedAt: result.stack.readNumber(),
            isActive: result.stack.readBoolean(),
        };
    }

    async getClubStats(provider: ContractProvider): Promise<{
        totalMembers: number;
        totalRevenue: bigint;
        artistId: string;
    }> {
        const result = await provider.get('get_club_stats', []);
        return {
            totalMembers: result.stack.readNumber(),
            totalRevenue: result.stack.readBigNumber(),
            artistId: result.stack.readString(),
        };
    }

    async getBalance(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_balance', []);
        return result.stack.readBigNumber();
    }

    async getOwner(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('get_owner', []);
        return result.stack.readAddress();
    }
}