const BLACK = '#212121';
const WHITE = '#f2f2f5';
const RED = '#fd0000';
const GREEN = '#00fd00';
const YELLOW = '#fdfd00';
const BLUE = '#0000fd';

let defaults = {
  initialised: false,
  logging: false,
  labels: {
    info: {
      background: BLUE,
      color: WHITE,
    },
    debug: {
      background: BLACK,
      color: WHITE,
    },
    warn: {
      background: YELLOW,
      color: BLACK,
    },
    error: {
      background: RED,
      color: WHITE,
    },
    log: {
      background: GREEN,
      color: BLACK,
    },
  },
  message: 'color: inherit; font-weight: normal; padding-left: 8px',
};

/**
 * Update the defaults object by shallow merging any new key value pairs
 * @param {Object} config – object that needs to be shallow merged
 */
export const updateDefaults = (config = {}) => {
  if (typeof config !== 'object' || typeof defaults !== 'object') return;

  defaults = { ...defaults, ...config };
};

/**
 * Central location for default values that control the app flow
 * @returns {Object} defaults object
 */
export const getDefaults = () => defaults;

const styleOut = (type) => {
  if (typeof type !== 'string') throw new Error(`type must be a string, got ${typeof type}`);

  const style = {
    background: defaults.labels[type].background,
    color: defaults.labels[type].color,
    font_weight: 'bold',
    text_transform: 'uppercase',
    padding: '2px 6px',
    border_radius: '3px',
  };

  let outString = `background: ${style.background};`;
  outString += `color: ${style.color};`;
  outString += `font-weight: ${style.font_weight};`;
  outString += `text-transform: ${style.text_transform};`;
  outString += `padding: ${style.padding};`;
  outString += `border-radius: ${style.border_radius};`;

  return outString;
};

export const out = (message, type = 'log') => {
  if (!getDefaults().logging) return;

  if (typeof message !== 'string')
    throw new Error(`message must be a string, got ${typeof message}`);

  if (typeof type !== 'string') throw new Error(`log must be a string, got ${typeof type}`);

  const labelStyle = styleOut(type) || styleOut('info');
  const messageStyle = getDefaults().message;
  const label = type.toUpperCase();

  switch (type) {
    case 'debug':
      console.debug(`%c${label}%c${message}`, labelStyle, messageStyle);
      break;
    case 'warn':
      console.warn(`%c${label}%c${message}`, labelStyle, messageStyle);
      break;
    case 'error':
      console.error(`%c${label}%c${message}`, labelStyle, messageStyle);
      break;
    case 'log':
      console.log(`%c${label}%c${message}`, labelStyle, messageStyle);
      break;
    default:
      console.info(`%c${label}%c${message}`, labelStyle, messageStyle);
      break;
  }
};

export { DependencyManager } from './DependencyManager.js';
