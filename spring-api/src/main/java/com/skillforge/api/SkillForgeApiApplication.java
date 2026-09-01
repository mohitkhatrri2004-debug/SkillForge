package com.skillforge.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SkillForge Spring Boot API — Entry Point
 *
 * @SpringBootApplication combines three annotations:
 *   @Configuration       — this class is a source of bean definitions
 *   @EnableAutoConfiguration — Spring Boot auto-configures based on
 *                              classpath (sees spring-web → starts Tomcat)
 *   @ComponentScan       — scans com.skillforge.api.* for components
 *
 * Week 7 Day 3: serves course data from courses.json
 * Future weeks: will connect to MongoDB for persistent course storage
 */
@SpringBootApplication
public class SkillForgeApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillForgeApiApplication.class, args);
    }
}
