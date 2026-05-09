/* note: must use this exact pattern to get chunking to generate correctly */
const Core = await import('./Core/index.js');
const DX = await import('./DX/index.js');
const Event = await import('./Event/index.js');
const Maths = await import('./Maths/index.js');
const Performance = await import('./Performance/index.js');
const String = await import('./String/index.js');

const Apex = {
  Core,
  DX,
  Event,
  Maths,
  Performance,
  String,
};
Apex.version = '0.2.1';

export { Apex as Apex, Apex as default };
export {
  Core as Core,
  DX as DX,
  Event as Event,
  Maths as Maths,
  Performance as Performance,
  String as String,
};
