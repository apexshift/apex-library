import { EventEmitter } from '../../dist/Event/EventEmitter.js';

const emitter = new EventEmitter();

// Basic demo
const basicOutput = document.getElementById('basic-output');
emitter.on('click', (payload) => {
  basicOutput.textContent += `Basic listener: ${payload || 'no payload'}\n`;
});
emitter.on('data', (payload) => {
  basicOutput.textContent += `Data listener: ${JSON.stringify(payload)}\n`;
});
document.getElementById('emit-basic').addEventListener('click', () => emitter.emit('click'));
document.getElementById('emit-data').addEventListener('click', () =>
  emitter.emit('data', { message: 'Hello from EventEmitter!', timestamp: Date.now() })
);

// Once vs On demo
const onceOutput = document.getElementById('once-output');
let onCount = 0;
let onceCount = 0;

emitter.on('test', () => {
  onCount++;
  onceOutput.textContent = `On listener fired ${onCount} times\nOnce listener fired ${onceCount} times\n`;
});
emitter.once('test', () => {
  onceCount++;
  onceOutput.textContent = `On listener fired ${onCount} times\nOnce listener fired ${onceCount} times\n`;
});
document.getElementById('emit-once-test').addEventListener('click', () => emitter.emit('test'));

// Error handling demo
const errorOutput = document.getElementById('error-output');
emitter.on('error-test', () => { throw new Error('Intentional error in listener'); });
emitter.on('error-test', () => { errorOutput.textContent += 'Good listener still ran!\n'; });
document.getElementById('emit-error').addEventListener('click', () => {
  emitter.emit('error-test');
  errorOutput.textContent += 'Error handled gracefully\n';
});

// Unsubscribe demo
const unsubOutput = document.getElementById('unsub-output');
let unsubCount = 0;

const listener1 = () => {
  unsubCount++;
  unsubOutput.textContent += `Listener 1 fired (${unsubCount})\n`;
};
const listener2 = () => { unsubOutput.textContent += 'Listener 2 fired\n'; };

emitter.on('unsub-test', listener1);
emitter.on('unsub-test', listener2);
document.getElementById('emit-unsub').addEventListener('click', () => emitter.emit('unsub-test'));
document.getElementById('unsubscribe').addEventListener('click', () => {
  emitter.off('unsub-test', listener1);
  unsubOutput.textContent += 'Listener 1 unsubscribed\n';
});
