package com.ggukgguki.core.domain.snapshot

import com.ggukgguki.core.domain.holding.Holding
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "snapshot_detail")
class SnapshotDetail(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    var snapshot: WeeklySnapshot,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holding_id", nullable = false)
    var holding: Holding,

    @Column(nullable = false, precision = 15, scale = 6)
    var quantity: BigDecimal,

    @Column(nullable = false, precision = 15, scale = 4)
    var price: BigDecimal,

    @Column(name = "avg_price", nullable = false, precision = 15, scale = 4)
    var avgPrice: BigDecimal,

    @Column(name = "evaluated_amount", nullable = false, precision = 15, scale = 2)
    var evaluatedAmount: BigDecimal,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
