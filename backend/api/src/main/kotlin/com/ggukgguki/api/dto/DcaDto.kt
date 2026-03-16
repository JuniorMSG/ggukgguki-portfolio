package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.dca.DcaRecord
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

@Schema(description = "DCA 기록 생성 요청")
data class DcaCreateRequest(
    @Schema(description = "계좌 ID")
    val accountId: Long,
    @Schema(description = "투자 금액 (원)", example = "1000000")
    val amount: Long,
    @Schema(description = "투자일", example = "2026-03-10")
    val recordDate: LocalDate,
    @Schema(description = "메모")
    val memo: String? = null
)

@Schema(description = "DCA 기록 수정 요청")
data class DcaUpdateRequest(
    val accountId: Long? = null,
    val amount: Long? = null,
    val recordDate: LocalDate? = null,
    val memo: String? = null
)

@Schema(description = "DCA 기록 정보")
data class DcaResult(
    val id: Long,
    val accountId: Long,
    @Schema(description = "투자 금액 (원)")
    val amount: Long,
    val recordDate: LocalDate,
    val memo: String?
) {
    companion object {
        fun from(record: DcaRecord) = DcaResult(
            id = record.id,
            accountId = record.account.id,
            amount = record.amount,
            recordDate = record.recordDate,
            memo = record.memo
        )
    }
}
