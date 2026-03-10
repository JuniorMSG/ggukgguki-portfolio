package com.ggukgguki.api.service

import com.ggukgguki.api.dto.HoldingCreateRequest
import com.ggukgguki.api.dto.HoldingResult
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
    private val assetClassRepository: AssetClassRepository
) {
    fun getAll(): List<HoldingResult> =
        holdingRepository.findAll().map { HoldingResult.from(it) }

    fun getByAccount(accountId: Long): List<HoldingResult> =
        holdingRepository.findByAccountId(accountId).map { HoldingResult.from(it) }

    @Transactional
    fun create(request: HoldingCreateRequest): HoldingResult {
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: ${request.accountId}") }
        val assetClass = assetClassRepository.findById(request.assetClassId)
            .orElseThrow { IllegalArgumentException("자산군을 찾을 수 없어요: ${request.assetClassId}") }

        val holding = Holding(
            account = account,
            assetClass = assetClass,
            ticker = request.ticker,
            name = request.name,
            currency = request.currency
        )
        return HoldingResult.from(holdingRepository.save(holding))
    }
}
