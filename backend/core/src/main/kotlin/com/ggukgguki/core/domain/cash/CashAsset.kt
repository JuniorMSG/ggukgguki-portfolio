package com.ggukgguki.core.domain.cash

import com.ggukgguki.core.domain.user.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "cash_asset")
class CashAsset(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(nullable = false, length = 50)
    var name: String,

    @Column(nullable = false, length = 20)
    var category: String, // FIXED or LIQUID

    @Column(nullable = false)
    var balance: Long = 0,

    @Column(name = "interest_rate", precision = 5, scale = 2)
    var interestRate: BigDecimal = BigDecimal.ZERO,

    @Column(name = "maturity_date")
    var maturityDate: LocalDate? = null,

    var memo: String? = null,

    @Column(name = "is_active")
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
