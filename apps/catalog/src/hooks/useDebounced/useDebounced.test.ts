import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounced } from './useDebounced';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebounced', () => {
  it('returns the initial value immediately', () => {
    expect(renderHook(() => useDebounced('a', 300)).result.current).toBe('a');
  });

  it('only updates after the value has been stable for the delay', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    act(() => void vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current).toBe('ab');
  });

  it('restarts the timer on every change (only the last value wins)', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    act(() => void vi.advanceTimersByTime(200));
    rerender({ v: 'abc' });
    act(() => void vi.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // 400ms passed, but the timer restarted at 200
    act(() => void vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });

  it('does not update after unmount', () => {
    const { result, rerender, unmount } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } });
    rerender({ v: 'b' });
    unmount();
    expect(() => act(() => void vi.advanceTimersByTime(500))).not.toThrow();
    expect(result.current).toBe('a');
  });
});
