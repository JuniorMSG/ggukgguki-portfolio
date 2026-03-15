package com.ggukgguki.core.domain.snapshot

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface WeeklySnapshotRepository : JpaRepository<WeeklySnapshot, Long> {
    fun findByUserIdOrderByStartDateDesc(userId: Long): List<WeeklySnapshot>
    fun findByUserIdAndStartDateBetweenOrderByStartDate(userId: Long, from: LocalDate, to: LocalDate): List<WeeklySnapshot>
}
