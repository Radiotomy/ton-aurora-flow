import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type RewardDistributorConfig = {
    owner: Address;
    reward_pool: bigint;
    distribution_period: number; // in seconds
    min_claim_amount: bigint;
};

export function rewardDistributorConfigToCell(config: RewardDistributorConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeCoins(config.reward_pool)
        .storeUint(config.distribution_period, 32)
        .storeCoins(config.min_claim_amount)
        .endCell();
}

export class RewardDistributorContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new RewardDistributorContract(address);
    }

    static createFromConfig(config: RewardDistributorConfig, code: Cell, workchain = 0) {
        const data = rewardDistributorConfigToCell(config);
        const init = { code, data };
        return new RewardDistributorContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendAddRewards(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            rewardAmount: bigint;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x01, 32) // add_rewards opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeCoins(opts.rewardAmount)
                .endCell(),
        });
    }

    async sendClaimRewards(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            claimant: Address;
            amount: bigint;
            activityProof: Cell;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x02, 32) // claim_rewards opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.claimant)
                .storeCoins(opts.amount)
                .storeRef(opts.activityProof)
                .endCell(),
        });
    }

    async sendDistributeRewards(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            recipients: Array<{
                address: Address;
                amount: bigint;
                rewardType: string;
            }>;
            queryId?: number;
        }
    ) {
        const distributionList = beginCell();
        for (const recipient of opts.recipients) {
            distributionList.storeRef(
                beginCell()
                    .storeAddress(recipient.address)
                    .storeCoins(recipient.amount)
                    .storeStringTail(recipient.rewardType)
                    .endCell()
            );
        }

        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x03, 32) // distribute_rewards opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeRef(distributionList.endCell())
                .endCell(),
        });
    }

    async sendUpdateConfig(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            newDistributionPeriod?: number;
            newMinClaimAmount?: bigint;
            queryId?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x04, 32) // update_config opcode
                .storeUint(opts.queryId ?? 0, 64)
                .storeUint(opts.newDistributionPeriod ?? 0, 32)
                .storeCoins(opts.newMinClaimAmount ?? 0n)
                .endCell(),
        });
    }

    async getRewardPoolBalance(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_reward_pool_balance', []);
        return result.stack.readBigNumber();
    }

    async getUserRewards(provider: ContractProvider, user: Address): Promise<{
        pendingRewards: bigint;
        totalClaimed: bigint;
        lastClaimTime: number;
    }> {
        const result = await provider.get('get_user_rewards', [
            { type: 'slice', cell: beginCell().storeAddress(user).endCell() }
        ]);
        return {
            pendingRewards: result.stack.readBigNumber(),
            totalClaimed: result.stack.readBigNumber(),
            lastClaimTime: result.stack.readNumber(),
        };
    }

    async getDistributionStats(provider: ContractProvider): Promise<{
        totalDistributed: bigint;
        totalRecipients: number;
        lastDistributionTime: number;
        distributionPeriod: number;
    }> {
        const result = await provider.get('get_distribution_stats', []);
        return {
            totalDistributed: result.stack.readBigNumber(),
            totalRecipients: result.stack.readNumber(),
            lastDistributionTime: result.stack.readNumber(),
            distributionPeriod: result.stack.readNumber(),
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