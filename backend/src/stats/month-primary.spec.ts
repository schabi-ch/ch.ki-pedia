/// <reference types="jest" />

import { currentMonthPrimary } from './month-primary';

describe('currentMonthPrimary', () => {
  it('formats March 2026 as 26-03', () => {
    expect(currentMonthPrimary(new Date(2026, 2, 16))).toBe('26-03');
  });

  it('pads single-digit months and years', () => {
    expect(currentMonthPrimary(new Date(2007, 0, 1))).toBe('07-01');
  });

  it('uses the provided date month boundary', () => {
    expect(currentMonthPrimary(new Date(2026, 0, 31, 23, 59))).toBe('26-01');
    expect(currentMonthPrimary(new Date(2026, 1, 1, 0, 0))).toBe('26-02');
  });
});
