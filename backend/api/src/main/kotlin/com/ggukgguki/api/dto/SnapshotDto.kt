package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.snapshot.WeeklySnapshot
import java.math.BigDecimal

data class SnapshotResult(
    val id: Long,
    val weekLabel: String,
    val startDate: String,
    val endDate: String,
    val totalCapital: Long,
    val totalInvestment: Long,
    val capitalGrowthRate: BigDecimal,
    val investmentGrowthRate: BigDecimal,
    val investedPlusCash: Long,
    val totalDividend: Long,
    val returnRate: BigDecimal,
    val returnRateTr: BigDecimal,
    val acctOverseas: Long,
    val acctDomestic: Long,
    val acctIrp: Long,
    val acctPension1: Long,
    val acctPension2: Long,
    val acctIsa: Long,
    val acctCash: Long,
    val weeklyChange: Long,
    val weeklyDividend: Long,
    val assetGrowth: Long,
    val assetDividend: Long,
    val assetBond: Long,
    val assetCash: Long,
    val assetDomestic: Long,
    val exchangeRate: BigDecimal
) {
    companion object {
        fun from(s: WeeklySnapshot) = SnapshotResult(
            id = s.id, weekLabel = s.weekLabel,
            startDate = s.startDate.toString(), endDate = s.endDate.toString(),
            totalCapital = s.totalCapital, totalInvestment = s.totalInvestment,
            capitalGrowthRate = s.capitalGrowthRate, investmentGrowthRate = s.investmentGrowthRate,
            investedPlusCash = s.investedPlusCash, totalDividend = s.totalDividend,
            returnRate = s.returnRate, returnRateTr = s.returnRateTr,
            acctOverseas = s.acctOverseas, acctDomestic = s.acctDomestic,
            acctIrp = s.acctIrp, acctPension1 = s.acctPension1,
            acctPension2 = s.acctPension2, acctIsa = s.acctIsa, acctCash = s.acctCash,
            weeklyChange = s.weeklyChange, weeklyDividend = s.weeklyDividend,
            assetGrowth = s.assetGrowth, assetDividend = s.assetDividendStock,
            assetBond = s.assetBond, assetCash = s.assetCash, assetDomestic = s.assetDomestic,
            exchangeRate = s.exchangeRate
        )
    }
}
