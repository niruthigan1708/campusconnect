package com.campusconnect.dto.event;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventRejectRequest {
    // Optional - admin may reject without giving a reason
    private String reason;
}
