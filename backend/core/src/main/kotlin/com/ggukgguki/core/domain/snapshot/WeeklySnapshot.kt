package com.ggukgguki.core.domain.snapshot

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "weekly_snapshot")
class WeeklySnapshot(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "snapshot_date", nullable = false, unique = true)
    var snapshotDate: LocalDate,

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 2)
    var exchangeRate: BigDecimal,

    @Column(name = "total_krw", nullable = false)
    var totalKrw: Long,

    @Column(length = 500)
    var memo: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "snapshot", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val details: MutableList<SnapshotDetail> = mutableListOf()
)
