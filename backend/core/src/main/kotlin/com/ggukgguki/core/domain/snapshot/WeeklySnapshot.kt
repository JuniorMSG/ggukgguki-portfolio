package com.ggukgguki.core.domain.snapshot

import com.ggukgguki.core.domain.user.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "weekly_snapshot")
class WeeklySnapshot(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(name = "week_label", nullable = false, length = 20)
    var weekLabel: String,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "total_capital") var totalCapital: Long = 0,
    @Column(name = "total_investment") var totalInvestment: Long = 0,
    @Column(name = "capital_growth_rate") var capitalGrowthRate: BigDecimal = BigDecimal.ZERO,
    @Column(name = "investment_growth_rate") var investmentGrowthRate: BigDecimal = BigDecimal.ZERO,

    @Column(name = "invested_plus_cash") var investedPlusCash: Long = 0,
    @Column(name = "total_dividend") var totalDividend: Long = 0,
    @Column(name = "return_rate") var returnRate: BigDecimal = BigDecimal.ZERO,
    @Column(name = "return_rate_tr") var returnRateTr: BigDecimal = BigDecimal.ZERO,

    @Column(name = "acct_overseas") var acctOverseas: Long = 0,
    @Column(name = "acct_domestic") var acctDomestic: Long = 0,
    @Column(name = "acct_irp") var acctIrp: Long = 0,
    @Column(name = "acct_pension1") var acctPension1: Long = 0,
    @Column(name = "acct_pension2") var acctPension2: Long = 0,
    @Column(name = "acct_isa") var acctIsa: Long = 0,
    @Column(name = "acct_cash") var acctCash: Long = 0,

    @Column(name = "weekly_change") var weeklyChange: Long = 0,
    @Column(name = "weekly_dividend") var weeklyDividend: Long = 0,

    @Column(name = "asset_growth") var assetGrowth: Long = 0,
    @Column(name = "asset_dividend") var assetDividendStock: Long = 0,
    @Column(name = "asset_bond") var assetBond: Long = 0,
    @Column(name = "asset_cash") var assetCash: Long = 0,
    @Column(name = "asset_domestic") var assetDomestic: Long = 0,

    @Column(name = "exchange_rate") var exchangeRate: BigDecimal = BigDecimal.ZERO,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
