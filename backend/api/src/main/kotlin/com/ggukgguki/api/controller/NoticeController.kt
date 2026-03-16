package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.NoticeCreateRequest
import com.ggukgguki.api.dto.NoticeResult
import com.ggukgguki.api.dto.NoticeUpdateRequest
import com.ggukgguki.api.service.BoardService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "Notice", description = "공지사항")
@RestController
@RequestMapping("/api/notices")
class NoticeController(
    private val boardService: BoardService
) {
    @Operation(summary = "공지사항 목록")
    @GetMapping
    fun getAll(@PageableDefault(size = 10) pageable: Pageable): Page<NoticeResult> =
        boardService.getNotices(pageable)

    @Operation(summary = "공지사항 상세 (조회수 증가)")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): NoticeResult =
        boardService.getNotice(id)

    @Operation(summary = "공지사항 작성 (관리자)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    fun create(
        @RequestBody req: NoticeCreateRequest,
        @AuthenticationPrincipal userId: Long
    ): NoticeResult = boardService.createNotice(req, userId)

    @Operation(summary = "공지사항 수정 (관리자)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun update(
        @PathVariable id: Long,
        @RequestBody req: NoticeUpdateRequest
    ): NoticeResult = boardService.updateNotice(id, req)

    @Operation(summary = "공지사항 삭제 (관리자)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable id: Long) = boardService.deleteNotice(id)
}
