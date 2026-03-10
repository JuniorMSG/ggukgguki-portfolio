package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.dca.DcaRecord
import java.time.LocalDate

data class DcaCreateRequest(
    val accountId: Long,
    val amount: Long,
    val recordDate: LocalDate,
    val memo: String? = null
)

data class DcaResult(
    val id: Long,
    val accountId: Long,
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
