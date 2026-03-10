package com.ggukgguki.core.domain.income

import com.ggukgguki.core.domain.holding.Holding
import com.ggukgguki.core.enums.IncomeType
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "passive_income")
class PassiveIncome(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holding_id")
    var holding: Holding? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "income_type", nullable = false, length = 20)
    var incomeType: IncomeType,

    @Column(nullable = false, precision = 15, scale = 4)
    var amount: BigDecimal,

    @Column(nullable = false, length = 3)
    var currency: String = "USD",

    @Column(name = "income_date", nullable = false)
    var incomeDate: LocalDate,

    @Column(name = "is_predicted", nullable = false)
    var isPredicted: Boolean = false,

    @Column(length = 200)
    var memo: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
