const Bus = require('@next/react-dev-overlay/lib/internal/bus');
const {
  parseStack,
} = require('@next/react-dev-overlay/lib/internal/helpers/parseStack');
const ReactDOM = require('react-dom');
const { getNodeError } = require('@next/react-dev-overlay/lib/client');
const { ErrorOverlay } = require('.');

const premixData = document.getElementById('__PREMIX_DATA__');
const { err } = JSON.parse(premixData.innerHTML);

ReactDOM.hydrate(<ErrorOverlay error={err} />, document);

Bus.emit({
  type: Bus.TYPE_UNHANDLED_ERROR,
  reason: getNodeError(err),
  frames: parseStack(err.stack),
});

export {};
