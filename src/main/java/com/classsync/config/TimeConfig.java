package com.classsync.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

@Configuration
public class TimeConfig {

    @Bean
    public Clock clock(@Value("${app.timezone:Asia/Kolkata}") String timezone,
                       @Value("${app.clock.fixed-date:}") String fixedDate) {
        ZoneId zone = ZoneId.of(timezone);
        if (fixedDate != null && !fixedDate.isBlank()) {
            return Clock.fixed(LocalDate.parse(fixedDate).atTime(9, 0).atZone(zone).toInstant(), zone);
        }
        return Clock.system(zone);
    }
}
