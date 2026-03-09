package com.ggukgguki.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@SpringBootApplication
@EntityScan(basePackages = ["com.ggukgguki"])
@EnableJpaRepositories(basePackages = ["com.ggukgguki"])
class GgukggukiApplication

fun main(args: Array<String>) {
    runApplication<GgukggukiApplication>(*args)
}
