package com.ggukgguki.core.domain.dca

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface DcaRecordRepository : JpaRepository<DcaRecord, Long> {
    fun findByRecordDateBetweenOrderByRecordDateDesc(from: LocalDate, to: LocalDate): List<DcaRecord>
    fun findByAccountIdOrderByRecordDateDesc(accountId: Long): List<DcaRecord>
}
