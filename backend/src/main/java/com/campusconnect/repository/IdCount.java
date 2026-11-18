package com.campusconnect.repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * One row of a "count per id" aggregate query, e.g. registrations per event.
 * Lets a listing fetch all its counts in one grouped query instead of one
 * count query per row (the N+1 problem).
 */
public record IdCount(Long id, long count) {

    public static Map<Long, Long> toMap(List<IdCount> counts) {
        return counts.stream().collect(Collectors.toMap(IdCount::id, IdCount::count));
    }
}
