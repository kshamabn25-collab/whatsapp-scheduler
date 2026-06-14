const { validateConfig, buildSchedule } = require('../src/scheduler');

describe('validateConfig', () => {
  const validConfig = {
    startAt: '2026-06-15T10:00:00+05:30',
    stopAt: '2026-06-16T02:00:00+05:30',
    groups: ['Group A', 'Group B'],
    messages: ['msg1', 'msg2', 'msg3', 'msg4', 'msg5', 'msg6', 'msg7', 'msg8'],
  };

  test('passes for a valid config', () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  test('throws if startAt is missing', () => {
    const cfg = { ...validConfig, startAt: undefined };
    expect(() => validateConfig(cfg)).toThrow('startAt is missing or not a valid date');
  });

  test('throws if startAt is not a valid date', () => {
    const cfg = { ...validConfig, startAt: 'not-a-date' };
    expect(() => validateConfig(cfg)).toThrow('startAt is missing or not a valid date');
  });

  test('throws if stopAt is missing', () => {
    const cfg = { ...validConfig, stopAt: undefined };
    expect(() => validateConfig(cfg)).toThrow('stopAt is missing or not a valid date');
  });

  test('throws if stopAt is not a valid date', () => {
    const cfg = { ...validConfig, stopAt: 'not-a-date' };
    expect(() => validateConfig(cfg)).toThrow('stopAt is missing or not a valid date');
  });

  test('throws if stopAt is before startAt', () => {
    const cfg = { ...validConfig, stopAt: '2026-06-14T00:00:00+05:30' };
    expect(() => validateConfig(cfg)).toThrow('stopAt must be after startAt');
  });

  test('throws if groups is empty', () => {
    const cfg = { ...validConfig, groups: [] };
    expect(() => validateConfig(cfg)).toThrow('groups must be a non-empty array');
  });

  test('throws if messages is empty', () => {
    const cfg = { ...validConfig, messages: [] };
    expect(() => validateConfig(cfg)).toThrow('messages must be a non-empty array');
  });
});

describe('buildSchedule', () => {
  const baseConfig = {
    startAt: '2026-06-15T10:00:00.000Z',
    stopAt: '2026-06-16T02:00:00.000Z',
    groups: ['Group A'],
    messages: ['msg1', 'msg2', 'msg3', 'msg4', 'msg5', 'msg6', 'msg7', 'msg8'],
  };

  test('returns 8 entries when all fit within window', () => {
    const schedule = buildSchedule(baseConfig);
    expect(schedule).toHaveLength(8);
  });

  test('first message is scheduled at startAt', () => {
    const schedule = buildSchedule(baseConfig);
    expect(schedule[0].sendAt.toISOString()).toBe('2026-06-15T10:00:00.000Z');
  });

  test('second message is scheduled 2 hours after startAt', () => {
    const schedule = buildSchedule(baseConfig);
    expect(schedule[1].sendAt.toISOString()).toBe('2026-06-15T12:00:00.000Z');
  });

  test('messages after stopAt are excluded', () => {
    // stopAt cuts off after 4 hours — only messages 0-2 fit (0h, 2h, 4h)
    const cfg = {
      ...baseConfig,
      stopAt: '2026-06-15T14:01:00.000Z',
    };
    const schedule = buildSchedule(cfg);
    expect(schedule).toHaveLength(3);
    expect(schedule[2].message).toBe('msg3');
  });

  test('each entry has message and sendAt', () => {
    const schedule = buildSchedule(baseConfig);
    expect(schedule[0]).toEqual({
      message: 'msg1',
      sendAt: new Date('2026-06-15T10:00:00.000Z'),
    });
  });
});
