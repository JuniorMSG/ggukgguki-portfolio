package com.ggukgguki.core.domain.holding

import com.ggukgguki.core.domain.account.Account
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "holding")
class Holding(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_class_id", nullable = false)
    var assetClass: AssetClass,

    @Column(nullable = false, length = 20)
    var ticker: String,

    @Column(nullable = false, length = 100)
    var name: String,

    @Column(nullable = false, length = 3)
    var currency: String = "USD",

    @Column(nullable = false, precision = 15, scale = 6)
    var quantity: BigDecimal = BigDecimal.ZERO,

    @Column(name = "avg_price", nullable = false, precision = 15, scale = 4)
    var avgPrice: BigDecimal = BigDecimal.ZERO,

    @Column(length = 200)
    var memo: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
