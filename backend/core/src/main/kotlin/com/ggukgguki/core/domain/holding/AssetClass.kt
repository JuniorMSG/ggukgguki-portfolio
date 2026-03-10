package com.ggukgguki.core.domain.holding

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "asset_class")
class AssetClass(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    val parent: AssetClass? = null,

    @Column(nullable = false, length = 50)
    var name: String,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
