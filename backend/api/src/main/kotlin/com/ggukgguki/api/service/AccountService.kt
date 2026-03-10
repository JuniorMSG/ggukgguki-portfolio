package com.ggukgguki.api.service

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.core.domain.account.Account
import com.ggukgguki.core.domain.account.AccountRepository
import com.ggukgguki.core.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AccountService(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository
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
}
