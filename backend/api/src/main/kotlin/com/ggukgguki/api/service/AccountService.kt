package com.ggukgguki.api.service

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.core.domain.account.Account
import com.ggukgguki.core.domain.account.AccountRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AccountService(
    private val accountRepository: AccountRepository
) {
    fun getAll(): List<AccountResult> =
        accountRepository.findByIsActiveTrue().map { AccountResult.from(it) }

    fun getById(id: Long): AccountResult =
        accountRepository.findById(id)
            .map { AccountResult.from(it) }
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: $id") }

    @Transactional
    fun create(request: AccountCreateRequest): AccountResult {
        val account = Account(
            name = request.name,
            accountType = request.accountType,
            annualLimit = request.annualLimit
        )
        return AccountResult.from(accountRepository.save(account))
    }
}
