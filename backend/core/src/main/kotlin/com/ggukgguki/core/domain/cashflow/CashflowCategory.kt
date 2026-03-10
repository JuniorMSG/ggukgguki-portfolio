package com.ggukgguki.core.domain.cashflow

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "cashflow_category")
class CashflowCategory(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    val parent: CashflowCategory? = null,

    @Column(nullable = false, length = 50)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "flow_type", nullable = false, length = 10)
    val flowType: FlowType,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
