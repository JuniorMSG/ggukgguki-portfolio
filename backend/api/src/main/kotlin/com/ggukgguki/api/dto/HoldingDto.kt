package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.holding.Holding

data class HoldingCreateRequest(
    val accountId: Long,
    val assetClassId: Long,
    val ticker: String,
    val name: String,
    val currency: String = "USD"
)

data class HoldingResult(
    val id: Long,
    val accountId: Long,
    val assetClassId: Long,
    val ticker: String,
    val name: String,
    val currency: String
) {
    companion object {
        fun from(holding: Holding) = HoldingResult(
            id = holding.id,
            accountId = holding.account.id,
            assetClassId = holding.assetClass.id,
            ticker = holding.ticker,
            name = holding.name,
            currency = holding.currency
        )
    }
}
