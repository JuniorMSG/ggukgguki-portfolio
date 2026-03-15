package com.ggukgguki.api.security

import com.ggukgguki.core.domain.account.AccountRepository
import com.ggukgguki.core.domain.cash.CashAssetRepository
import com.ggukgguki.core.domain.dca.DcaRecordRepository
import com.ggukgguki.core.domain.holding.HoldingRepository
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class OwnershipChecker(
    private val accountRepository: AccountRepository,
    private val holdingRepository: HoldingRepository,
    private val dcaRecordRepository: DcaRecordRepository,
    private val cashAssetRepository: CashAssetRepository
) {
    private fun isAdmin(): Boolean {
        val auth = SecurityContextHolder.getContext().authentication ?: return false
        return auth.authorities.any { it.authority == "ROLE_ADMIN" }
    }

    fun checkAccountOwner(accountId: Long, userId: Long) {
        if (isAdmin()) return
        val account = accountRepository.findById(accountId)
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: $accountId") }
        if (account.user.id != userId) {
            throw AccessDeniedException("접근 권한이 없어요")
        }
    }

    fun checkHoldingOwner(holdingId: Long, userId: Long) {
        if (isAdmin()) return
        val holding = holdingRepository.findById(holdingId)
            .orElseThrow { IllegalArgumentException("종목을 찾을 수 없어요: $holdingId") }
        if (holding.account.user.id != userId) {
            throw AccessDeniedException("접근 권한이 없어요")
        }
    }

    fun checkDcaOwner(dcaId: Long, userId: Long) {
        if (isAdmin()) return
        val dca = dcaRecordRepository.findById(dcaId)
            .orElseThrow { IllegalArgumentException("DCA 기록을 찾을 수 없어요: $dcaId") }
        if (dca.account.user.id != userId) {
            throw AccessDeniedException("접근 권한이 없어요")
        }
    }

    fun checkCashAssetOwner(cashAssetId: Long, userId: Long) {
        if (isAdmin()) return
        val cashAsset = cashAssetRepository.findById(cashAssetId)
            .orElseThrow { IllegalArgumentException("자산을 찾을 수 없어요: $cashAssetId") }
        if (cashAsset.user.id != userId) {
            throw AccessDeniedException("접근 권한이 없어요")
        }
    }
}

class AccessDeniedException(message: String) : RuntimeException(message)
