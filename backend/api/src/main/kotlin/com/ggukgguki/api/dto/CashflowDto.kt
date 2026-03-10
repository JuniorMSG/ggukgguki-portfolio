package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.cashflow.CashflowCategory
import com.ggukgguki.core.domain.cashflow.CashflowRecord
import com.ggukgguki.core.domain.cashflow.FlowType
import java.time.LocalDate

data class CashflowCategoryResult(
    val id: Long,
    val name: String,
    val flowType: FlowType,
    val parentId: Long?,
    val displayOrder: Int
) {
    companion object {
        fun from(category: CashflowCategory) = CashflowCategoryResult(
            id = category.id,
            name = category.name,
            flowType = category.flowType,
            parentId = category.parent?.id,
            displayOrder = category.displayOrder
        )
    }
}

data class CashflowCreateRequest(
    val userId: Long,
    val categoryId: Long,
    val amount: Long,
    val recordDate: LocalDate,
    val memo: String? = null
)

data class CashflowRecordResult(
    val id: Long,
    val userId: Long,
    val categoryId: Long,
    val categoryName: String,
    val flowType: FlowType,
    val parentName: String?,
    val amount: Long,
    val recordDate: LocalDate,
    val memo: String?
) {
    companion object {
        fun from(record: CashflowRecord) = CashflowRecordResult(
            id = record.id,
            userId = record.user.id,
            categoryId = record.category.id,
            categoryName = record.category.name,
            flowType = record.category.flowType,
            parentName = record.category.parent?.name,
            amount = record.amount,
            recordDate = record.recordDate,
            memo = record.memo
        )
    }
}
