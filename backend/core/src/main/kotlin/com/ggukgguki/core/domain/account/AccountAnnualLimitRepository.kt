package com.ggukgguki.core.domain.account

import org.springframework.data.jpa.repository.JpaRepository

interface AccountAnnualLimitRepository : JpaRepository<AccountAnnualLimit, Long> {
    fun findByAccountId(accountId: Long): List<AccountAnnualLimit>
    fun findByAccountIdAndYear(accountId: Long, year: Int): AccountAnnualLimit?
    fun findByYear(year: Int): List<AccountAnnualLimit>
}
