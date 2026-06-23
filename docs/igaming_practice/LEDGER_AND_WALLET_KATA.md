# Ledger and Wallet Kata

Goal: practice the most important skill in the hiring poster: correctness of a
financial ledger under failure, replay, and concurrency.

## Core Rule

Every transaction is append-only and balanced:

```text
debit_total == credit_total
```

Never delete or rewrite financial history. Corrections are new reversal or
adjustment transactions.

## Toy Ledger Accounts

Use these local-only ledger accounts:

| Account | Type | Purpose |
|---|---|---|
| `cash:provider` | asset | simulated payment provider settlement |
| `liability:user:<id>` | liability | user wallet balance owed by the platform |
| `expense:bonus` | expense | simulated promotional credit expense |
| `revenue:fees` | revenue | simulated fee income |

## Practice Transactions

### Deposit

User receives 100 test credits from a simulated provider event.

```text
Dr cash:provider          100
Cr liability:user:alice   100
```

### Withdrawal Hold

User requests 40 test credits to be withdrawn. A real production system may use
reserved balances or pending liabilities. For the kata, record a pending
withdrawal state and avoid posting final settlement until the simulated
provider confirms.

### Withdrawal Settlement

Provider settlement reduces what the platform owes the user.

```text
Dr liability:user:alice    40
Cr cash:provider           40
```

### Bonus Credit

User receives 10 test credits as a simulated bonus.

```text
Dr expense:bonus           10
Cr liability:user:alice    10
```

### Reversal

Reverse a mistaken bonus by posting a new transaction.

```text
Dr liability:user:alice    10
Cr expense:bonus           10
```

## Test Cases

### Balanced Transaction

Input:

```json
{
  "transaction_id": "tx-001",
  "entries": [
    {"account": "cash:provider", "side": "debit", "amount": 100},
    {"account": "liability:user:alice", "side": "credit", "amount": 100}
  ]
}
```

Expected:

- accepted
- transaction status is `posted`
- debit total equals credit total

### Unbalanced Transaction

Input:

```json
{
  "transaction_id": "tx-002",
  "entries": [
    {"account": "cash:provider", "side": "debit", "amount": 100},
    {"account": "liability:user:alice", "side": "credit", "amount": 99}
  ]
}
```

Expected:

- rejected
- no ledger entries persisted
- audit event records `unbalanced_transaction`

### Duplicate Webhook

Input:

```json
{
  "provider": "simulated-provider",
  "idempotency_key": "deposit-event-001",
  "user_id": "alice",
  "amount": 100
}
```

Run the same input twice.

Expected:

- first call posts one deposit transaction
- second call returns duplicate-safe result
- user is credited exactly once

### Insufficient Balance

Initial:

```text
alice balance = 100
```

Action:

```text
withdraw 150
```

Expected:

- rejected
- no settlement transaction posted
- audit event records `insufficient_balance`

### Concurrent Withdrawal

Initial:

```text
alice balance = 100
```

Actions:

```text
withdraw 80 and withdraw 80 at the same time
```

Expected:

- exactly one succeeds or both enter a safe queue with locking
- final available balance is never negative
- ledger remains balanced

## Discussion Prompts

1. Would you use database row locks, serializable isolation, advisory locks, or
   Redis locks?
2. What data should be included in the idempotency record?
3. How long should idempotency keys be retained?
4. What should be emitted to realtime UI after a transaction posts?
5. What alerts would catch a ledger imbalance quickly?
