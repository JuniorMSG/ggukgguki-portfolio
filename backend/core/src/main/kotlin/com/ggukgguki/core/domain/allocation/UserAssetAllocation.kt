package com.ggukgguki.core.domain.allocation

import com.ggukgguki.core.domain.holding.AssetClass
import com.ggukgguki.core.domain.user.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "user_asset_allocation",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "asset_class_id"])]
)
class UserAssetAllocation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_class_id", nullable = false)
    val assetClass: AssetClass,

    @Column(name = "target_ratio", nullable = false)
    var targetRatio: BigDecimal = BigDecimal.ZERO,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
