// client: 외부 API 모듈 (Yahoo Finance, ECOS 환율, 배당 스크래핑)
plugins {
    kotlin("plugin.spring")
    id("io.spring.dependency-management")
}

dependencies {
    implementation(project(":core"))

    implementation("org.springframework:spring-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
}
