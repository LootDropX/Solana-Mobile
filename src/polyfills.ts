import { Buffer } from 'buffer';

declare global {
  // eslint-disable-next-line no-var
  var Buffer: any;
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof global !== 'undefined' && typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
