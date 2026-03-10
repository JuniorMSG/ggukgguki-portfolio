package com.ggukgguki.core.domain.cashflow

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface CashflowRecordRepository : JpaRepository<CashflowRecord, Long> {
    fun findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
        userId: Long, startDate: LocalDate, endDate: LocalDate
    ): List<CashflowRecord>

    fun findByUserIdOrderByRecordDateDesc(userId: Long): List<CashflowRecord>
}
