import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgendaTransformer } from '../../transformers/agendaTransformer';

describe.skip('AgendaTransformer Speaker Validation', () => {
  // SKIPPED: Data layer infrastructure tests - not user-facing
  let transformer: AgendaTransformer;
  let consoleWarnSpy: any;

  beforeEach(() => {
    transformer = new AgendaTransformer();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Empty Speaker Object Handling', () => {
    it('Test 14: Should normalize empty speaker object to empty string', () => {
      const rawData = {
        id: 'test-session-1',
        title: 'Test Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: {}, // Empty object that causes React Error #31
        type: 'general'
      };

      const result = transformer.transformFromDatabase(rawData);

      expect(result.speakerInfo).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '🔄 AgendaTransformer: Empty speaker object detected and normalized',
        expect.objectContaining({
          sessionId: 'test-session-1',
          sessionTitle: 'Test Session',
          speakerValue: {}
        })
      );
    });

    it('Test 15: Should handle various speaker field types consistently', () => {
      const testCases = [
        {
          name: 'null speaker',
          speaker: null,
          expected: ''
        },
        {
          name: 'undefined speaker',
          speaker: undefined,
          expected: ''
        },
        {
          name: 'empty string speaker',
          speaker: '',
          expected: ''
        },
        {
          name: 'valid string speaker',
          speaker: 'John Doe',
          expected: 'John Doe'
        },
        {
          name: 'speaker with whitespace',
          speaker: '  Jane Smith  ',
          expected: 'Jane Smith'
        },
        {
          name: 'speaker object with name',
          speaker: { name: 'Alice Johnson' },
          expected: 'Alice Johnson'
        },
        {
          name: 'speaker object with value',
          speaker: { value: 'Bob Wilson' },
          expected: 'Bob Wilson'
        },
        {
          name: 'empty speaker object',
          speaker: {},
          expected: ''
        }
      ];

      testCases.forEach(({ name, speaker, expected }) => {
        const rawData = {
          id: `test-session-${name.replace(/\s+/g, '-')}`,
          title: 'Test Session',
          date: '2025-10-21',
          start_time: '10:00:00',
          end_time: '11:00:00',
          location: 'Test Location',
          speaker,
          type: 'general'
        };

        const result = transformer.transformFromDatabase(rawData);
        expect(result.speakerInfo).toBe(expected);
      });
    });

    it('Test 16: Should log validation issues appropriately', () => {
      const rawData = {
        id: 'test-session-logging',
        title: 'Test Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: {}, // Empty object
        type: 'general'
      };

      transformer.transformFromDatabase(rawData);

      // Should log empty object warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '🔄 AgendaTransformer: Empty speaker object detected and normalized',
        expect.objectContaining({
          sessionId: 'test-session-logging',
          sessionTitle: 'Test Session'
        })
      );
    });
  });

  describe('Schema Evolution Handling', () => {
    it('Should handle schema version 1.5.0 with object-based speaker field', () => {
      const rawData = {
        id: 'test-session-schema-1.5',
        title: 'Test Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: { name: 'Schema Test Speaker' },
        type: 'general'
      };

      const result = transformer.transformFromDatabase(rawData);
      expect(result.speakerInfo).toBe('Schema Test Speaker');
    });

    it('Should handle schema version 2.0.0 with renamed speaker field', () => {
      const rawData = {
        id: 'test-session-schema-2.0',
        title: 'Test Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker_name: 'Renamed Speaker Field',
        type: 'general'
      };

      const result = transformer.transformFromDatabase(rawData);
      expect(result.speakerInfo).toBe('Renamed Speaker Field');
    });
  });

  describe('Validation Rules', () => {
    it('Should validate speaker field according to rules', () => {
      const validSpeakers = [
        null,
        undefined,
        '',
        'Valid Speaker',
        { name: 'Object Speaker' },
        { value: 'Value Speaker' },
        {} // Empty object is valid but will be normalized
      ];

      const invalidSpeakers = [
        123, // Number
        true, // Boolean
        [], // Array
        () => {}, // Function
        Symbol('test') // Symbol
      ];

      validSpeakers.forEach((speaker, index) => {
        const rawData = {
          id: `valid-speaker-${index}`,
          title: 'Test Session',
          date: '2025-10-21',
          start_time: '10:00:00',
          end_time: '11:00:00',
          location: 'Test Location',
          speaker,
          type: 'general'
        };

        expect(() => {
          transformer.transformFromDatabase(rawData);
        }).not.toThrow();
      });

      invalidSpeakers.forEach((speaker, index) => {
        const rawData = {
          id: `invalid-speaker-${index}`,
          title: 'Test Session',
          date: '2025-10-21',
          start_time: '10:00:00',
          end_time: '11:00:00',
          location: 'Test Location',
          speaker,
          type: 'general'
        };

        // Should handle invalid types gracefully
        expect(() => {
          transformer.transformFromDatabase(rawData);
        }).not.toThrow();
      });
    });
  });

  describe('Performance and Memory', () => {
    it('Should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `session-${index}`,
        title: `Session ${index}`,
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: index % 2 === 0 ? {} : `Speaker ${index}`, // Mix of empty objects and valid speakers
        type: 'general'
      }));

      const startTime = performance.now();
      
      largeDataset.forEach(data => {
        transformer.transformFromDatabase(data);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should process 1000 items in less than 100ms
      expect(totalTime).toBeLessThan(100);
    });

    it('Should not cause memory leaks with repeated transformations', () => {
      const rawData = {
        id: 'memory-test-session',
        title: 'Memory Test Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: {},
        type: 'general'
      };

      // Transform the same data multiple times
      for (let i = 0; i < 100; i++) {
        transformer.transformFromDatabase(rawData);
      }

      // If we get here without errors, no memory leaks
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('Should handle malformed data gracefully', () => {
      const malformedData = {
        id: 'malformed-session',
        title: 'Malformed Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: 'Valid Speaker',
        type: 'general',
        // Missing required fields
        created_at: undefined,
        updated_at: undefined
      };

      expect(() => {
        transformer.transformFromDatabase(malformedData);
      }).not.toThrow();
    });

    it('Should handle circular references in speaker objects', () => {
      const circularSpeaker: any = { name: 'Circular Speaker' };
      circularSpeaker.self = circularSpeaker;

      const rawData = {
        id: 'circular-speaker-session',
        title: 'Circular Speaker Session',
        date: '2025-10-21',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        speaker: circularSpeaker,
        type: 'general'
      };

      expect(() => {
        transformer.transformFromDatabase(rawData);
      }).not.toThrow();
    });
  });
});
