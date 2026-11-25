// Render react-icons to base64 PNG for pptxgenjs
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

async function icon(IconComp, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
module.exports = { icon };
