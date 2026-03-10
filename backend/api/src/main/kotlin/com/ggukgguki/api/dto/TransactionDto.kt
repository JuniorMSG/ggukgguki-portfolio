package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.transaction.Transaction
import com.ggukgguki.core.enums.TransactionType
import java.math.BigDecimal
import java.time.LocalDate

data class TransactionCreateRequest(
    val holdingId: Long,
    val type: TransactionType,
    val quantity: BigDecimal,
    val price: BigDecimal,
    val transactionDate: LocalDate,
    val memo: String? = null
)

data class TransactionResult(
    val id: Long,
    val holdingId: Long,
    val type: TransactionType,
    val quantity: BigDecimal,
    val price: BigDecimal,
    val totalAmount: BigDecimal,
    val transactionDate: LocalDate,
    val memo: String?
) {
    companion object {
        fun from(tx: Transaction) = TransactionResult(
            id = tx.id,
            holdingId = tx.holding.id,
            type = tx.type,
            quantity = tx.quantity,
            price = tx.price,
            totalAmount = tx.totalAmount,
            transactionDate = tx.transactionDate,
            memo = tx.memo
        )
    }
}
