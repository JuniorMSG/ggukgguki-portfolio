package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.SnapshotResult
import com.ggukgguki.core.domain.snapshot.WeeklySnapshotRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@Tag(name = "Snapshot", description = "주간 스냅샷")
@RestController
@RequestMapping("/api/snapshots")
class SnapshotController(
    private val snapshotRepository: WeeklySnapshotRepository
) {
    @Operation(summary = "전체 주간 스냅샷 조회")
    @GetMapping
    fun getAll(@RequestParam userId: Long): List<SnapshotResult> =
        snapshotRepository.findByUserIdOrderByStartDateDesc(userId).map { SnapshotResult.from(it) }

    @Operation(summary = "연도별 주간 스냅샷 조회")
    @GetMapping(params = ["userId", "year"])
    fun getByYear(@RequestParam userId: Long, @RequestParam year: Int): List<SnapshotResult> =
        snapshotRepository.findByUserIdAndStartDateBetweenOrderByStartDate(
            userId, LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)
        ).map { SnapshotResult.from(it) }
}
