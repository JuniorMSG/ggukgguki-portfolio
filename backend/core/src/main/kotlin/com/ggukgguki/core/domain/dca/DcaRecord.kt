package com.ggukgguki.core.domain.dca

import com.ggukgguki.core.domain.account.Account
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "dca_record")
class DcaRecord(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    var account: Account,

    @Column(nullable = false)
    var amount: Long,

    @Column(name = "record_date", nullable = false)
    var recordDate: LocalDate,

    @Column(length = 200)
    var memo: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
