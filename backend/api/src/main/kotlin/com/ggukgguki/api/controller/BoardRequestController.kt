package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.*
import com.ggukgguki.api.service.BoardService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*

@Tag(name = "Request", description = "요청사항")
@RestController
@RequestMapping("/api/requests")
class BoardRequestController(
    private val boardService: BoardService
) {
    private fun isAdmin(): Boolean =
        SecurityContextHolder.getContext().authentication?.authorities
            ?.any { it.authority == "ROLE_ADMIN" } == true

    @Operation(summary = "요청사항 목록 (필터/검색)")
    @GetMapping
    fun getAll(
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) keyword: String?,
        @PageableDefault(size = 10) pageable: Pageable
    ): Page<RequestResult> = boardService.getRequests(category, status, keyword, pageable)

    @Operation(summary = "요청사항 상세 (조회수 증가)")
    @GetMapping("/{id}")
    fun getById(
        @PathVariable id: Long,
        @AuthenticationPrincipal userId: Long
    ): RequestResult = boardService.getRequest(id, userId)

    @Operation(summary = "요청사항 작성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody req: RequestCreateDto,
        @AuthenticationPrincipal userId: Long
    ): RequestResult = boardService.createRequest(req, userId)

    @Operation(summary = "요청사항 수정 (본인만)")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody req: RequestUpdateDto,
        @AuthenticationPrincipal userId: Long
    ): RequestResult = boardService.updateRequest(id, req, userId)

    @Operation(summary = "요청사항 삭제 (본인만)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable id: Long,
        @AuthenticationPrincipal userId: Long
    ) = boardService.deleteRequest(id, userId)

    @Operation(summary = "상태 변경 (관리자)")
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateStatus(
        @PathVariable id: Long,
        @RequestBody req: StatusUpdateDto
    ): RequestResult = boardService.updateStatus(id, req.status)

    @Operation(summary = "좋아요/싫어요 (토글)")
    @PostMapping("/{id}/vote")
    fun vote(
        @PathVariable id: Long,
        @RequestBody req: VoteDto,
        @AuthenticationPrincipal userId: Long
    ): RequestResult = boardService.vote(id, userId, req.voteType)

    @Operation(summary = "댓글 목록")
    @GetMapping("/{id}/comments")
    fun getComments(@PathVariable id: Long): List<CommentResult> =
        boardService.getComments(id)

    @Operation(summary = "댓글 작성")
    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    fun createComment(
        @PathVariable id: Long,
        @RequestBody req: CommentCreateDto,
        @AuthenticationPrincipal userId: Long
    ): CommentResult = boardService.createComment(id, req, userId, isAdmin())

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteComment(
        @PathVariable commentId: Long,
        @AuthenticationPrincipal userId: Long
    ) = boardService.deleteComment(commentId, userId, isAdmin())
}
