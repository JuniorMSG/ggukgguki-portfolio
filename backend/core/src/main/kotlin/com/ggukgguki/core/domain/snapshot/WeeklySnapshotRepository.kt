package com.ggukgguki.core.domain.snapshot

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface WeeklySnapshotRepository : JpaRepository<WeeklySnapshot, Long> {
    fun findBySnapshotDate(date: LocalDate): WeeklySnapshot?
    fun findTop10ByOrderBySnapshotDateDesc(): List<WeeklySnapshot>
}
