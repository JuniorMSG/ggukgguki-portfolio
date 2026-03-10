package com.ggukgguki.core.domain.transaction

import com.ggukgguki.core.domain.holding.Holding
import com.ggukgguki.core.enums.TransactionType
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "transaction")
class Transaction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holding_id", nullable = false)
    var holding: Holding,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    var type: TransactionType,

    @Column(nullable = false, precision = 15, scale = 6)
    var quantity: BigDecimal,

    @Column(nullable = false, precision = 15, scale = 4)
    var price: BigDecimal,

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    var totalAmount: BigDecimal,

    @Column(name = "transaction_date", nullable = false)
    var transactionDate: LocalDate,

    @Column(length = 200)
    var memo: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
