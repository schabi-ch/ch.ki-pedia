/// <reference types="jest" />

import {
  classifyBackgroundValue,
  findBackgroundValue,
  hasExplicitTextColor,
} from './inline-background-colors';

describe('classifyBackgroundValue', () => {
  it('classifies light colours across notations', () => {
    expect(classifyBackgroundValue('#f9f9f9')).toBe('light');
    expect(classifyBackgroundValue('#eee')).toBe('light');
    expect(classifyBackgroundValue('white')).toBe('light');
    expect(classifyBackgroundValue('rgb(245, 245, 245)')).toBe('light');
    expect(classifyBackgroundValue('rgb(245 245 245 / 0.9)')).toBe('light');
    expect(classifyBackgroundValue('hsl(0, 0%, 95%)')).toBe('light');
  });

  it('classifies dark colours across notations', () => {
    expect(classifyBackgroundValue('#202122')).toBe('dark');
    expect(classifyBackgroundValue('navy')).toBe('dark');
    expect(classifyBackgroundValue('rgba(0, 0, 0, 0.95)')).toBe('dark');
  });

  it('uses the fallback of a MediaWiki custom property', () => {
    expect(
      classifyBackgroundValue('var(--couleur-fond-boite-grise, #f9f9f9)'),
    ).toBe('light');
    expect(classifyBackgroundValue('var(--some-colour, #111)')).toBe('dark');
  });

  it('ignores values without a resolvable opaque colour', () => {
    expect(
      classifyBackgroundValue('var(--couleur-fond-boite-grise)'),
    ).toBeNull();
    expect(classifyBackgroundValue('transparent')).toBeNull();
    expect(classifyBackgroundValue('none')).toBeNull();
    expect(classifyBackgroundValue('rgba(255, 255, 255, 0.2)')).toBeNull();
    expect(
      classifyBackgroundValue('linear-gradient(to right, #fff, #000)'),
    ).toBeNull();
    expect(classifyBackgroundValue('')).toBeNull();
  });

  it('reads the colour out of a background shorthand', () => {
    expect(classifyBackgroundValue('#fff url(a.png) no-repeat')).toBe('light');
  });
});

describe('findBackgroundValue', () => {
  it('returns the last winning background declaration', () => {
    expect(findBackgroundValue('background:#fff; background-color:#000')).toBe(
      '#000',
    );
    expect(findBackgroundValue('color:#333; font-size:95%')).toBeUndefined();
  });

  it('does not confuse background-image with a colour', () => {
    expect(findBackgroundValue('background-image:url(a.png)')).toBeUndefined();
  });
});

describe('hasExplicitTextColor', () => {
  it('detects a pinned text colour', () => {
    expect(hasExplicitTextColor('color:#333')).toBe(true);
    expect(hasExplicitTextColor('background:#fff;color:red')).toBe(true);
  });

  it('treats inherit and background-color as no text colour', () => {
    expect(hasExplicitTextColor('color:inherit')).toBe(false);
    expect(hasExplicitTextColor('background-color:#fff')).toBe(false);
    expect(hasExplicitTextColor('')).toBe(false);
  });
});
