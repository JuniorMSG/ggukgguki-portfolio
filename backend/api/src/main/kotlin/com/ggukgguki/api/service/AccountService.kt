package com.ggukgguki.api.service

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.api.dto.AnnualLimitRequest
import com.ggukgguki.api.dto.AnnualLimitResult
import com.ggukgguki.api.security.OwnershipChecker
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
    private val annualLimitRepository: AccountAnnualLimitRepository,
    private val ownershipChecker: OwnershipChecker
) {
    fun getByUserId(userId: Long): List<AccountResult> =
        accountRepository.findByUserIdAndIsActiveTrue(userId).map { AccountResult.from(it) }

    fun getById(id: Long, userId: Long): AccountResult {
        ownershipChecker.checkAccountOwner(id, userId)
        return accountRepository.findById(id)
            .map { AccountResult.from(it) }
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: $id") }
    }

    @Transactional
    fun create(request: AccountCreateRequest, userId: Long): AccountResult {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요: $userId") }
        val account = Account(
            user = user,
            name = request.name,
            accountType = request.accountType,
            annualLimit = request.annualLimit
        )
        return AccountResult.from(accountRepository.save(account))
    }

    fun getLimits(accountId: Long, userId: Long): List<AnnualLimitResult> {
        ownershipChecker.checkAccountOwner(accountId, userId)
        return annualLimitRepository.findByAccountId(accountId)
            .sortedBy { it.year }
            .map { AnnualLimitResult.from(it) }
    }

    @Transactional
    fun setLimit(accountId: Long, request: AnnualLimitRequest, userId: Long): AnnualLimitResult {
        ownershipChecker.checkAccountOwner(accountId, userId)
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
