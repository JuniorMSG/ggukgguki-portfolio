package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.cashflow.CashflowCategory
import com.ggukgguki.core.domain.cashflow.CashflowRecord
import com.ggukgguki.core.domain.cashflow.FlowType
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

@Schema(description = "수입/지출 카테고리 정보")
data class CashflowCategoryResult(
    val id: Long,
    @Schema(description = "카테고리명", example = "식비")
    val name: String,
    @Schema(description = "수입/지출 구분")
    val flowType: FlowType,
    @Schema(description = "상위 카테고리 ID (null이면 대분류)")
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

@Schema(description = "수입/지출 기록 생성 요청")
data class CashflowCreateRequest(
    @Schema(description = "소분류 카테고리 ID")
    val categoryId: Long,
    @Schema(description = "금액 (원)", example = "50000")
    val amount: Long,
    @Schema(description = "기록일", example = "2026-03-10")
    val recordDate: LocalDate,
    val memo: String? = null
)

@Schema(description = "수입/지출 기록 정보")
data class CashflowRecordResult(
    val id: Long,
    val userId: Long,
    val categoryId: Long,
    @Schema(description = "카테고리명")
    val categoryName: String,
    @Schema(description = "수입/지출 구분")
    val flowType: FlowType,
    @Schema(description = "상위 카테고리명")
    val parentName: String?,
    @Schema(description = "금액 (원)")
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
