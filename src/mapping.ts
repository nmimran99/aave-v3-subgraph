import { BigInt } from "@graphprotocol/graph-ts"
import {
  BorrowLogic,
  Borrow,
  IsolationModeTotalDebtUpdated,
  RebalanceStableBorrowRate,
  Repay,
  SwapBorrowRateMode
} from "../generated/BorrowLogic/BorrowLogic"
import { BorrowEvent, Account, Reserve, RepayEvent } from "../generated/schema"
import { createAccount, updateCommonATokenStats } from "./helpers";

export function handleBorrow(event: Borrow): void {
  
  let reserve = Reserve.load(event.address.toHexString());
  // TODO: add reserve if it doesnt exist
  if (reserve == null) return;

  let accountID = event.params.user.toHex();
  let account = Account.load(accountID);
  if (account == null) {
    account = createAccount(accountID);
  }
  account.hasBorrowed = true;
  account.save();

  // What does underlyingBorrow means?
  let aTokenStats = updateCommonATokenStats(
    reserve.id,
    accountID,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex
  )
  
  // TO ADD - 
  // totalUnderlyingBorrowed - add the amount to the totalUnderlyingBorrowed?
  // accountBorrowIndex - ??

  aTokenStats.save()

  let borrowId = event.transaction.hash.toHexString();

  let borrowAmount = event.params.amount.toBigDecimal();
  let borrow = new BorrowEvent(borrowId);
  borrow.reserve = event.address
  borrow.borrower = event.params.user;
  borrow.onBehalfOf = event.params.onBehalfOf;
  borrow.amount = borrowAmount;
  borrow.borrowRate = event.params.borrowRate;
  borrow.interestRateMode = event.params.interestRateMode;
  borrow.blockNumber = event.block.number.toI32();
  borrow.blockTime = event.block.timestamp.toI32();
  borrow.save();
}

export function handleIsolationModeTotalDebtUpdated(
  event: IsolationModeTotalDebtUpdated
): void {}

export function handleRebalanceStableBorrowRate(
  event: RebalanceStableBorrowRate
): void {}

export function handleRepay(event: Repay): void {
  let reserve = Reserve.load(event.address.toHexString());
  if (reserve == null) return;
  let accountID = event.params.user.toHex();
  let account = Account.load(accountID);
  if (account == null) {
    account = createAccount(accountID);
  }
  
  // Where can I get the current AToken balance?
  // What does underlyingBorrow means?

  let aTokenStats = updateCommonATokenStats(
    reserve.id,
    accountID,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex
  )
  
  // TO ADD - 
  // totalUnderlyingRepaid  - add the amount to the totalUnderlyingBorrowed?
  // accountBorrowIndex - ??

  aTokenStats.aTokenBalance = aTokenStats.aTokenBalance
    .minus(event.params.amount.toBigDecimal())
  
  aTokenStats.save()
  
  let repayID = event.transaction.hash
  .toHex()
  .concat('-')
  .concat(event.transactionLogIndex.toString())

  let repayAmount = event.params.amount.toBigDecimal();

  let repay = new RepayEvent(repayID)
  repay.reserve = event.address
  repay.amount = repayAmount
  repay.borrower = event.params.user
  repay.repayer = event.params.repayer
  repay.useATokens = event.params.useATokens
  repay.blockTime = event.block.timestamp.toI32()
  repay.blockNumber = event.block.number.toI32()
  
  repay.save()
}

export function handleSwapBorrowRateMode(event: SwapBorrowRateMode): void {}
