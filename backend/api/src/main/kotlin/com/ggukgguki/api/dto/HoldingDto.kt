package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.holding.Holding
import java.math.BigDecimal

data class HoldingUpdateRequest(
    val ticker: String? = null,
    val quantity: BigDecimal? = null,
    val avgPrice: BigDecimal? = null,
    val name: String? = null,
    val memo: String? = null
)

data class HoldingCreateRequest(
    val accountId: Long,
    val assetClassId: Long,
    val ticker: String,
    val name: String,
    val currency: String = "USD",
    val quantity: BigDecimal = BigDecimal.ZERO,
    val avgPrice: BigDecimal = BigDecimal.ZERO,
    val memo: String? = null
)

data class HoldingResult(
    val id: Long,
    val accountId: Long,
    val assetClassId: Long,
    val ticker: String,
    val name: String,
    val currency: String,
    val quantity: BigDecimal,
    val avgPrice: BigDecimal,
    val totalAmount: BigDecimal,
    val memo: String?
) {
    companion object {
        fun from(holding: Holding) = HoldingResult(
            id = holding.id,
            accountId = holding.account.id,
            assetClassId = holding.assetClass.id,
            ticker = holding.ticker,
            name = holding.name,
            currency = holding.currency,
            quantity = holding.quantity,
            avgPrice = holding.avgPrice,
            totalAmount = holding.quantity.multiply(holding.avgPrice),
            memo = holding.memo
        )
    }
}
