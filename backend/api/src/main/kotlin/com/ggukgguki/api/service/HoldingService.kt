package com.ggukgguki.api.service

import com.ggukgguki.api.dto.HoldingCreateRequest
import com.ggukgguki.api.dto.HoldingUpdateRequest
import com.ggukgguki.api.dto.HoldingResult
import com.ggukgguki.api.security.OwnershipChecker
import com.ggukgguki.core.domain.account.AccountRepository
import com.ggukgguki.core.domain.holding.AssetClassRepository
import com.ggukgguki.core.domain.holding.Holding
import com.ggukgguki.core.domain.holding.HoldingRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class HoldingService(
    private val holdingRepository: HoldingRepository,
    private val accountRepository: AccountRepository,
    private val assetClassRepository: AssetClassRepository,
    private val ownershipChecker: OwnershipChecker
) {
    fun getByAccount(accountId: Long, userId: Long): List<HoldingResult> {
        ownershipChecker.checkAccountOwner(accountId, userId)
        return holdingRepository.findByAccountId(accountId).map { HoldingResult.from(it) }
    }

    @Transactional
    fun update(id: Long, request: HoldingUpdateRequest, userId: Long): HoldingResult {
        ownershipChecker.checkHoldingOwner(id, userId)
        val holding = holdingRepository.findById(id)
            .orElseThrow { IllegalArgumentException("종목을 찾을 수 없어요: $id") }
        request.quantity?.let { holding.quantity = it }
        request.avgPrice?.let { holding.avgPrice = it }
        request.ticker?.let { holding.ticker = it }
        request.name?.let { holding.name = it }
        request.memo?.let { holding.memo = it }
        holding.updatedAt = java.time.LocalDateTime.now()
        return HoldingResult.from(holdingRepository.save(holding))
    }

    @Transactional
    fun create(request: HoldingCreateRequest, userId: Long): HoldingResult {
        ownershipChecker.checkAccountOwner(request.accountId, userId)
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: ${request.accountId}") }
        val assetClass = assetClassRepository.findById(request.assetClassId)
            .orElseThrow { IllegalArgumentException("자산군을 찾을 수 없어요: ${request.assetClassId}") }

        val holding = Holding(
            account = account,
            assetClass = assetClass,
            ticker = request.ticker,
            name = request.name,
            currency = request.currency,
            quantity = request.quantity,
            avgPrice = request.avgPrice,
            memo = request.memo
        )
        return HoldingResult.from(holdingRepository.save(holding))
    }

    @Transactional
    fun delete(id: Long, userId: Long) {
        ownershipChecker.checkHoldingOwner(id, userId)
        holdingRepository.deleteById(id)
    }
}
