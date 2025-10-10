package com.courseflow.common.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for date and time operations.
 */
public class DateTimeUtil {
    
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final ZoneId UTC = ZoneId.of("UTC");
    
    /**
     * Convert Instant to LocalDateTime in UTC
     */
    public static LocalDateTime toLocalDateTime(Instant instant) {
        return LocalDateTime.ofInstant(instant, UTC);
    }
    
    /**
     * Convert LocalDateTime to Instant in UTC
     */
    public static Instant toInstant(LocalDateTime localDateTime) {
        return localDateTime.toInstant(ZoneOffset.UTC);
    }
    
    /**
     * Get current time as Instant in UTC
     */
    public static Instant now() {
        return Instant.now();
    }
    
    /**
     * Get current time as LocalDateTime in UTC
     */
    public static LocalDateTime nowLocal() {
        return LocalDateTime.now(UTC);
    }
    
    /**
     * Format LocalDateTime as ISO string
     */
    public static String format(LocalDateTime localDateTime) {
        return localDateTime.format(ISO_FORMATTER);
    }
    
    /**
     * Parse ISO string to LocalDateTime
     */
    public static LocalDateTime parse(String dateTimeString) {
        return LocalDateTime.parse(dateTimeString, ISO_FORMATTER);
    }
}

