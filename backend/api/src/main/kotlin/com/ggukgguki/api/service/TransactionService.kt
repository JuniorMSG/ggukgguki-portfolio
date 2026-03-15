package com.ggukgguki.api.service

import com.ggukgguki.api.dto.TransactionCreateRequest
import com.ggukgguki.api.dto.TransactionResult
import com.ggukgguki.api.security.OwnershipChecker
import com.ggukgguki.core.domain.holding.HoldingRepository
import com.ggukgguki.core.domain.transaction.Transaction
import com.ggukgguki.core.domain.transaction.TransactionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TransactionService(
    private val transactionRepository: TransactionRepository,
    private val holdingRepository: HoldingRepository,
    private val ownershipChecker: OwnershipChecker
) {
    fun getByHolding(holdingId: Long, userId: Long): List<TransactionResult> {
        ownershipChecker.checkHoldingOwner(holdingId, userId)
        return transactionRepository.findByHoldingIdOrderByTransactionDateDesc(holdingId)
            .map { TransactionResult.from(it) }
    }

    @Transactional
    fun create(request: TransactionCreateRequest, userId: Long): TransactionResult {
        ownershipChecker.checkHoldingOwner(request.holdingId, userId)
        val holding = holdingRepository.findById(request.holdingId)
            .orElseThrow { IllegalArgumentException("종목을 찾을 수 없어요: ${request.holdingId}") }

        val totalAmount = request.quantity.multiply(request.price)

        val transaction = Transaction(
            holding = holding,
            type = request.type,
            quantity = request.quantity,
            price = request.price,
            totalAmount = totalAmount,
            transactionDate = request.transactionDate,
            memo = request.memo
        )
        return TransactionResult.from(transactionRepository.save(transaction))
    }
}
