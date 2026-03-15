package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.account.AccountAnnualLimit

data class AnnualLimitRequest(
    val accountId: Long,
    val year: Int,
    val annualLimit: Long
)

data class AnnualLimitResult(
    val id: Long,
    val accountId: Long,
    val year: Int,
    val annualLimit: Long
) {
    companion object {
        fun from(entity: AccountAnnualLimit) = AnnualLimitResult(
            id = entity.id,
            accountId = entity.account.id,
            year = entity.year,
            annualLimit = entity.annualLimit
        )
    }
}
