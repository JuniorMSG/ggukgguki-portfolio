package com.ggukgguki.core.domain.transaction

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface TransactionRepository : JpaRepository<Transaction, Long> {
    fun findByHoldingIdOrderByTransactionDateDesc(holdingId: Long): List<Transaction>
    fun findByTransactionDateBetweenOrderByTransactionDateDesc(from: LocalDate, to: LocalDate): List<Transaction>
}
