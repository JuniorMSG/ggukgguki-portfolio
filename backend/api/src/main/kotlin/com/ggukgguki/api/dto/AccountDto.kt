package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.account.Account
import com.ggukgguki.core.enums.AccountType
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "계좌 생성 요청")
data class AccountCreateRequest(
    @Schema(description = "계좌명", example = "연금저축1")
    val name: String,
    @Schema(description = "계좌 유형", example = "PENSION_SAVINGS")
    val accountType: AccountType,
    @Schema(description = "연간 납입 한도 (원)", example = "6000000")
    val annualLimit: Long? = null
)

@Schema(description = "계좌 수정 요청")
data class AccountUpdateRequest(
    val name: String? = null,
    val accountType: AccountType? = null,
    val annualLimit: Long? = null
)

@Schema(description = "계좌 정보")
data class AccountResult(
    val id: Long,
    val userId: Long,
    val name: String,
    val accountType: AccountType,
    @Schema(description = "연간 납입 한도 (원)")
    val annualLimit: Long?,
    val isActive: Boolean
) {
    companion object {
        fun from(account: Account) = AccountResult(
            id = account.id,
            userId = account.user.id,
            name = account.name,
            accountType = account.accountType,
            annualLimit = account.annualLimit,
            isActive = account.isActive
        )
    }
}
