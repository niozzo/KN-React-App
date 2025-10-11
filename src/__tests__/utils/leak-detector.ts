/**
 * Leak Detector Utility
 * 
 * Tracks intervals, timeouts, and event listeners to identify memory leaks
 * and resource cleanup issues in tests.
 */

export class LeakDetector {
  private static intervals: Set<NodeJS.Timeout> = new Set();
  private static timeouts: Set<NodeJS.Timeout> = new Set();
  private static listeners: Map<string, EventListener[]> = new Map();
  
  static trackInterval(id: NodeJS.Timeout, source: string) {
    this.intervals.add(id);
    console.log(`[LEAK] Interval created: ${source}, Total: ${this.intervals.size}`);
  }
  
  static untrackInterval(id: NodeJS.Timeout, source: string) {
    this.intervals.delete(id);
    console.log(`[LEAK] Interval cleared: ${source}, Remaining: ${this.intervals.size}`);
  }
  
  static trackListener(event: string, handler: EventListener, source: string) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(handler);
    console.log(`[LEAK] Listener added: ${event} from ${source}, Total listeners: ${this.listeners.size}`);
  }
  
  static untrackListener(event: string, handler: EventListener, source: string) {
    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
    console.log(`[LEAK] Listener removed: ${event} from ${source}`);
  }
  
  static report() {
    console.log('\n=== LEAK DETECTOR REPORT ===');
    console.log(`Active Intervals: ${this.intervals.size}`);
    console.log(`Active Timeouts: ${this.timeouts.size}`);
    const listenerReport = Array.from(this.listeners.entries())
      .map(([e, h]) => `${e}:${h.length}`)
      .join(', ');
    console.log(`Active Listeners: ${listenerReport || 'none'}`);
    console.log('===========================\n');
  }
  
  static reset() {
    this.intervals.clear();
    this.timeouts.clear();
    this.listeners.clear();
  }
}

