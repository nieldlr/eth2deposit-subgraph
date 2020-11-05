import { BigInt } from "@graphprotocol/graph-ts"
import {
  Eth2DepositContract,
  DepositEvent
} from "../generated/Eth2DepositContract/Eth2DepositContract"
import { Depositor, Deposit, Aggregation } from "../generated/schema"

export function handleDepositEvent(event: DepositEvent): void {
  let aggregation = Aggregation.load("1")

  if (aggregation == null) {
    // If this is the first time, set defaults
    aggregation = new Aggregation("1")
    aggregation.totalDeposits = BigInt.fromI32(0)
    aggregation.totalDepositors = BigInt.fromI32(0)
    aggregation.totalAmountDeposited = BigInt.fromI32(0)
  }

  let depositor = Depositor.load(event.transaction.from.toHex())
  if(depositor == null) {
    depositor = new Depositor(event.transaction.from.toHex())
    depositor.depositCount = BigInt.fromI32(0)
    depositor.totalAmountDeposited = BigInt.fromI32(0)
    aggregation.totalDepositors = aggregation.totalDepositors.plus(BigInt.fromI32(1))
  }

  depositor.depositCount = depositor.depositCount.plus(BigInt.fromI32(1))
  aggregation.totalDeposits = aggregation.totalDeposits.plus(BigInt.fromI32(1))

  let deposit = Deposit.load(event.transaction.hash.toHex())
  deposit = new Deposit(event.transaction.hash.toHex())

  deposit.pubkey = event.params.pubkey
  deposit.withdrawal_credentials = event.params.withdrawal_credentials
  deposit.amount = BigInt.fromUnsignedBytes(event.params.amount)
  deposit.depositor = event.transaction.from.toHex()
  deposit.timestamp = event.block.timestamp

  depositor.totalAmountDeposited = depositor.totalAmountDeposited.plus(deposit.amount)
  aggregation.totalAmountDeposited = aggregation.totalAmountDeposited.plus(deposit.amount)

  // Entities can be written to the store with `.save()`
  deposit.save()
  depositor.save()
  aggregation.save()
}
