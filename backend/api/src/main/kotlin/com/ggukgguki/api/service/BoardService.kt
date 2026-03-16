package com.ggukgguki.api.service

import com.ggukgguki.api.dto.*
import com.ggukgguki.core.domain.board.*
import com.ggukgguki.core.domain.user.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Service
@Transactional(readOnly = true)
class BoardService(
    private val noticeRepository: NoticeRepository,
    private val requestRepository: BoardRequestRepository,
    private val commentRepository: BoardCommentRepository,
    private val voteRepository: BoardVoteRepository,
    private val userRepository: UserRepository
) {
    // 조회수 중복 방지: "타입:ID:유저IP/ID" → 마지막 조회 시간
    private val viewCache = ConcurrentHashMap<String, Long>()
    private val VIEW_COOLDOWN_MS = 10_000L // 10초 내 중복 조회 무시

    private fun shouldCountView(type: String, id: Long, viewerKey: String): Boolean {
        val key = "$type:$id:$viewerKey"
        val now = System.currentTimeMillis()
        val lastView = viewCache.put(key, now)
        // 오래된 캐시 정리 (1000개 넘으면)
        if (viewCache.size > 1000) {
            viewCache.entries.removeIf { now - it.value > 60_000 }
        }
        return lastView == null || (now - lastView) > VIEW_COOLDOWN_MS
    }

    // ─── 공지사항 ───

    fun getNotices(pageable: Pageable): Page<NoticeResult> =
        noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable).map { NoticeResult.from(it) }

    @Transactional
    fun getNotice(id: Long, viewerKey: String = "anonymous"): NoticeResult {
        val notice = noticeRepository.findById(id).orElseThrow { IllegalArgumentException("공지사항을 찾을 수 없어요: $id") }
        if (shouldCountView("notice", id, viewerKey)) {
            notice.viewCount++
            noticeRepository.save(notice)
        }
        return NoticeResult.from(notice)
    }

    @Transactional
    fun createNotice(req: NoticeCreateRequest, userId: Long): NoticeResult {
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("유저 없음") }
        val notice = Notice(title = req.title, content = req.content, author = user, isPinned = req.isPinned)
        return NoticeResult.from(noticeRepository.save(notice))
    }

    @Transactional
    fun updateNotice(id: Long, req: NoticeUpdateRequest): NoticeResult {
        val notice = noticeRepository.findById(id).orElseThrow { IllegalArgumentException("공지사항을 찾을 수 없어요: $id") }
        req.title?.let { notice.title = it }
        req.content?.let { notice.content = it }
        req.isPinned?.let { notice.isPinned = it }
        notice.updatedAt = LocalDateTime.now()
        return NoticeResult.from(noticeRepository.save(notice))
    }

    @Transactional
    fun deleteNotice(id: Long) {
        noticeRepository.deleteById(id)
    }

    // ─── 요청사항 ───

    fun getRequests(category: String?, status: String?, keyword: String?, pageable: Pageable): Page<RequestResult> =
        requestRepository.search(category, status, keyword, pageable).map { RequestResult.from(it) }

    @Transactional
    fun getRequest(id: Long, userId: Long): RequestResult {
        val request = requestRepository.findById(id).orElseThrow { IllegalArgumentException("요청사항을 찾을 수 없어요: $id") }
        if (shouldCountView("request", id, userId.toString())) {
            request.viewCount++
            requestRepository.save(request)
        }
        val myVote = voteRepository.findByRequestIdAndUserId(id, userId)?.voteType
        return RequestResult.from(request, myVote)
    }

    @Transactional
    fun createRequest(req: RequestCreateDto, userId: Long): RequestResult {
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("유저 없음") }
        val request = BoardRequest(title = req.title, content = req.content, author = user, category = req.category)
        return RequestResult.from(requestRepository.save(request))
    }

    @Transactional
    fun updateRequest(id: Long, req: RequestUpdateDto, userId: Long): RequestResult {
        val request = requestRepository.findById(id).orElseThrow { IllegalArgumentException("요청사항을 찾을 수 없어요: $id") }
        if (request.author.id != userId) throw IllegalArgumentException("수정 권한이 없어요")
        req.title?.let { request.title = it }
        req.content?.let { request.content = it }
        req.category?.let { request.category = it }
        request.updatedAt = LocalDateTime.now()
        return RequestResult.from(requestRepository.save(request))
    }

    @Transactional
    fun deleteRequest(id: Long, userId: Long) {
        val request = requestRepository.findById(id).orElseThrow { IllegalArgumentException("요청사항을 찾을 수 없어요: $id") }
        if (request.author.id != userId) throw IllegalArgumentException("삭제 권한이 없어요")
        requestRepository.delete(request)
    }

    @Transactional
    fun updateStatus(id: Long, status: String): RequestResult {
        val request = requestRepository.findById(id).orElseThrow { IllegalArgumentException("요청사항을 찾을 수 없어요: $id") }
        request.status = status
        request.updatedAt = LocalDateTime.now()
        return RequestResult.from(requestRepository.save(request))
    }

    // ─── 투표 ───

    @Transactional
    fun vote(requestId: Long, userId: Long, voteType: String): RequestResult {
        val request = requestRepository.findById(requestId).orElseThrow { IllegalArgumentException("요청사항을 찾을 수 없어요: $requestId") }
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("유저 없음") }
        val existing = voteRepository.findByRequestIdAndUserId(requestId, userId)

        if (existing != null) {
            if (existing.voteType == voteType) {
                // 같은 투표 → 취소
                voteRepository.delete(existing)
                if (voteType == "LIKE") request.likeCount-- else request.dislikeCount--
            } else {
                // 다른 투표 → 전환
                if (existing.voteType == "LIKE") request.likeCount-- else request.dislikeCount--
                existing.voteType = voteType
                voteRepository.save(existing)
                if (voteType == "LIKE") request.likeCount++ else request.dislikeCount++
            }
        } else {
            // 새 투표
            voteRepository.save(BoardVote(request = request, user = user, voteType = voteType))
            if (voteType == "LIKE") request.likeCount++ else request.dislikeCount++
        }

        requestRepository.save(request)
        val myVote = voteRepository.findByRequestIdAndUserId(requestId, userId)?.voteType
        return RequestResult.from(request, myVote)
    }

    // ─── 댓글 ───

    fun getComments(requestId: Long): List<CommentResult> =
        commentRepository.findByRequestIdOrderByCreatedAtAsc(requestId).map { CommentResult.from(it) }

    @Transactional
    fun createComment(requestId: Long, req: CommentCreateDto, userId: Long, isAdmin: Boolean): CommentResult {
        val request = requestRepository.findById(requestId).orElseThrow { IllegalArgumentException("요청사항을 찾을 수 없어요: $requestId") }
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("유저 없음") }
        val comment = BoardComment(request = request, author = user, content = req.content, isAdminReply = isAdmin)
        return CommentResult.from(commentRepository.save(comment))
    }

    @Transactional
    fun deleteComment(commentId: Long, userId: Long, isAdmin: Boolean) {
        val comment = commentRepository.findById(commentId).orElseThrow { IllegalArgumentException("댓글을 찾을 수 없어요: $commentId") }
        if (!isAdmin && comment.author.id != userId) throw IllegalArgumentException("삭제 권한이 없어요")
        commentRepository.delete(comment)
    }
}
