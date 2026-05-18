import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('pboc-rates.json', () => {
  const jsonPath = path.resolve(__dirname, '../../data/pboc-rates.json');

  it('exists and is valid JSON', () => {
    expect(fs.existsSync(jsonPath)).toBe(true);

    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    expect(data).toBeDefined();
  });

  it('contains array with at least 5 entries', () => {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(5);
  });

  it('each entry has date, rate, and type fields', () => {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    data.forEach((entry: any) => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('rate');
      expect(entry).toHaveProperty('type');
    });
  });

  it('date format is YYYY-MM-DD', () => {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    data.forEach((entry: any) => {
      expect(entry.date).toMatch(dateRegex);
    });
  });

  it('rate values are valid numbers', () => {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    data.forEach((entry: any) => {
      expect(typeof entry.rate).toBe('number');
      expect(entry.rate).toBeGreaterThan(0);
      expect(entry.rate).toBeLessThan(100); // Reasonable upper bound for interest rates
    });
  });
});