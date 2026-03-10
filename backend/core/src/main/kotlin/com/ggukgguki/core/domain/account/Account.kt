package com.ggukgguki.core.domain.account

import com.ggukgguki.core.enums.AccountType
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "account")
class Account(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, length = 50)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 30)
    var accountType: AccountType,

    @Column(name = "annual_limit")
    var annualLimit: Long? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
