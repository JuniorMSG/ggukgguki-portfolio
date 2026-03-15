package com.ggukgguki.api.service

import com.ggukgguki.api.dto.CashflowCategoryResult
import com.ggukgguki.api.dto.CashflowCreateRequest
import com.ggukgguki.api.dto.CashflowRecordResult
import com.ggukgguki.core.domain.cashflow.CashflowCategoryRepository
import com.ggukgguki.core.domain.cashflow.CashflowRecord
import com.ggukgguki.core.domain.cashflow.CashflowRecordRepository
import com.ggukgguki.core.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class CashflowService(
    private val categoryRepository: CashflowCategoryRepository,
    private val recordRepository: CashflowRecordRepository,
    private val userRepository: UserRepository
) {
    fun getCategories(): List<CashflowCategoryResult> =
        categoryRepository.findAllByOrderByFlowTypeAscDisplayOrderAsc()
            .map { CashflowCategoryResult.from(it) }

    fun getRecords(userId: Long, startDate: LocalDate, endDate: LocalDate): List<CashflowRecordResult> =
        recordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, startDate, endDate)
            .map { CashflowRecordResult.from(it) }

    @Transactional
    fun create(request: CashflowCreateRequest, userId: Long): CashflowRecordResult {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요: $userId") }
        val category = categoryRepository.findById(request.categoryId)
            .orElseThrow { IllegalArgumentException("카테고리를 찾을 수 없어요: ${request.categoryId}") }

        val record = CashflowRecord(
            user = user,
            category = category,
            amount = request.amount,
            recordDate = request.recordDate,
            memo = request.memo
        )
        return CashflowRecordResult.from(recordRepository.save(record))
    }

    @Transactional
    fun delete(id: Long) {
        if (!recordRepository.existsById(id)) {
            throw IllegalArgumentException("기록을 찾을 수 없어요: $id")
        }
        recordRepository.deleteById(id)
    }
}
