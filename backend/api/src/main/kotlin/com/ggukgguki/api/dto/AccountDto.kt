package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.account.Account
import com.ggukgguki.core.enums.AccountType

data class AccountCreateRequest(
    val name: String,
    val accountType: AccountType,
    val annualLimit: Long? = null
)

data class AccountResult(
    val id: Long,
    val name: String,
    val accountType: AccountType,
    val annualLimit: Long?,
    val isActive: Boolean
) {
    companion object {
        fun from(account: Account) = AccountResult(
            id = account.id,
            name = account.name,
            accountType = account.accountType,
            annualLimit = account.annualLimit,
            isActive = account.isActive
        )
    }
}
