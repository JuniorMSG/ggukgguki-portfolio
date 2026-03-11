package com.ggukgguki.api.service

import com.ggukgguki.api.dto.DcaCreateRequest
import com.ggukgguki.api.dto.DcaResult
import com.ggukgguki.core.domain.account.AccountRepository
import com.ggukgguki.core.domain.dca.DcaRecord
import com.ggukgguki.core.domain.dca.DcaRecordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class DcaService(
    private val dcaRecordRepository: DcaRecordRepository,
    private val accountRepository: AccountRepository
) {
    fun getByYear(year: Int): List<DcaResult> {
        val from = LocalDate.of(year, 1, 1)
        val to = LocalDate.of(year, 12, 31)
        return dcaRecordRepository.findByRecordDateBetweenOrderByRecordDateDesc(from, to)
            .map { DcaResult.from(it) }
    }

    fun getByAccount(accountId: Long): List<DcaResult> =
        dcaRecordRepository.findByAccountIdOrderByRecordDateDesc(accountId)
            .map { DcaResult.from(it) }

    @Transactional
    fun create(request: DcaCreateRequest): DcaResult {
        val account = accountRepository.findById(request.accountId)
            .orElseThrow { IllegalArgumentException("계좌를 찾을 수 없어요: ${request.accountId}") }

        val record = DcaRecord(
            account = account,
            amount = request.amount,
            recordDate = request.recordDate,
            memo = request.memo
        )
        return DcaResult.from(dcaRecordRepository.save(record))
    }

    @Transactional
    fun delete(id: Long) {
        if (!dcaRecordRepository.existsById(id)) {
            throw IllegalArgumentException("DCA 기록을 찾을 수 없어요: $id")
        }
        dcaRecordRepository.deleteById(id)
    }
}
