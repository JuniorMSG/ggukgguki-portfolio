package com.ggukgguki.api.service

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.api.dto.AnnualLimitRequest
import com.ggukgguki.api.dto.AnnualLimitResult
import com.ggukgguki.core.domain.account.Account
import com.ggukgguki.core.domain.account.AccountAnnualLimit
import com.ggukgguki.core.domain.account.AccountAnnualLimitRepository
import com.ggukgguki.core.domain.account.AccountRepository
import com.ggukgguki.core.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AccountService(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val annualLimitRepository: AccountAnnualLimitRepository
) {
    fun getByUserId(userId: Long): List<AccountResult> =
        accountRepository.findByUserIdAndIsActiveTrue(userId).map { AccountResult.from(it) }

    fun getById(id: Long): AccountResult =
        accountRepository.findById(id)
            .map { AccountResult.from(it) }
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: $id") }

    @Transactional
    fun create(request: AccountCreateRequest): AccountResult {
        val user = userRepository.findById(request.userId)
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요: ${request.userId}") }
        val account = Account(
            user = user,
            name = request.name,
            accountType = request.accountType,
            annualLimit = request.annualLimit
        )
        return AccountResult.from(accountRepository.save(account))
    }

    fun getLimits(accountId: Long): List<AnnualLimitResult> =
        annualLimitRepository.findByAccountId(accountId)
            .sortedBy { it.year }
            .map { AnnualLimitResult.from(it) }

    @Transactional
    fun setLimit(accountId: Long, request: AnnualLimitRequest): AnnualLimitResult {
        val account = accountRepository.findById(accountId)
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: $accountId") }

        val existing = annualLimitRepository.findByAccountIdAndYear(accountId, request.year)
        val entity = if (existing != null) {
            existing.annualLimit = request.annualLimit
            existing
        } else {
            AccountAnnualLimit(account = account, year = request.year, annualLimit = request.annualLimit)
        }
        return AnnualLimitResult.from(annualLimitRepository.save(entity))
    }
}
