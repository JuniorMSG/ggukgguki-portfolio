// core: 순수 도메인 모듈 (외부 의존 없음)
plugins {
    kotlin("plugin.jpa")
}

dependencies {
    // JPA 엔티티 정의용 (구현체 아닌 API만)
    compileOnly("jakarta.persistence:jakarta.persistence-api:3.1.0")
}
