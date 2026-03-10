package com.ggukgguki.core.domain.account

import org.springframework.data.jpa.repository.JpaRepository

interface AccountRepository : JpaRepository<Account, Long> {
    fun findByIsActiveTrue(): List<Account>
}
