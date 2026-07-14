const { src, dest } = require('gulp');

// Copy node icons AND codex metadata (*.node.json) into dist so they ship in
// the published package. The codex supplies the node's categories, search
// aliases, and documentation link; without it n8n falls back to defaults.
function buildIcons() {
	return src('nodes/**/*.{png,svg,json}')
		.pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
exports.default = buildIcons;

