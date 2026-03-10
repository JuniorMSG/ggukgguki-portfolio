package com.ggukgguki.core.domain.income

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface PassiveIncomeRepository : JpaRepository<PassiveIncome, Long> {
    fun findByIncomeDateBetweenOrderByIncomeDateDesc(from: LocalDate, to: LocalDate): List<PassiveIncome>
    fun findByIsPredictedOrderByIncomeDateDesc(isPredicted: Boolean): List<PassiveIncome>
}
