package com.campusconnect.dto.common;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Getter
@Builder
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        return from(page, page.getContent().stream().map(mapper).toList());
    }

    /** For content mapped as a batch (e.g. to fetch related counts in one query). */
    public static <S, T> PageResponse<T> from(Page<S> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
