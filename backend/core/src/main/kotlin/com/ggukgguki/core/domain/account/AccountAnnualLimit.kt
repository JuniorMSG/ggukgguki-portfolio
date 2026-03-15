package com.ggukgguki.core.domain.account

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "account_annual_limit", uniqueConstraints = [UniqueConstraint(columnNames = ["account_id", "year"])])
class AccountAnnualLimit(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @Column(nullable = false)
    var year: Int,

    @Column(name = "annual_limit", nullable = false)
    var annualLimit: Long,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
