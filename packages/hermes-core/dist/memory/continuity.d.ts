export type TrackedEventType = "parked_topic" | "watchful_state" | "delegated_task" | "sensitive_event";
export interface TrackedEvent {
    id: string;
    type: TrackedEventType;
    context_before: string;
    event_core: string;
    immediate_result: string;
    followup_focus: string;
    timestamp: number;
}
export declare class HermesContinuity {
    private events;
    private stagedMemory;
    stage(info: string): void;
    track(event: Omit<TrackedEvent, "id" | "timestamp">): TrackedEvent;
    carryover(): {
        recent_memory: string[];
        latest_event: TrackedEvent;
    };
}
//# sourceMappingURL=continuity.d.ts.map