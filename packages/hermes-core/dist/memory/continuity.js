export class HermesContinuity {
    events = [];
    stagedMemory = [];
    stage(info) {
        if (!info.trim())
            return;
        this.stagedMemory.push(info);
    }
    track(event) {
        const next = {
            ...event,
            id: `event-${Date.now()}`,
            timestamp: Date.now()
        };
        this.events.push(next);
        return next;
    }
    carryover() {
        return {
            recent_memory: this.stagedMemory.slice(-4),
            latest_event: this.events[this.events.length - 1] || null
        };
    }
}
//# sourceMappingURL=continuity.js.map