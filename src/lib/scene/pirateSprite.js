// @ts-nocheck — Three.js sprites expose incomplete ambient types in this project.
import * as THREE from 'three';

/** A high-detail, view-facing captain render with optional pose-specific portraits. */
export function makePirateSprite(
	source,
	{ width = 2.1, height = 3.4, frame = 0, cutoff = 0.12, autoFit = false, maxHeight = height, maxWidth = width, floorY = 0 } = {}
) {
	const urls = Array.isArray(source) ? source : [source];
	const loader = new THREE.TextureLoader();
	let currentFrame = frame % urls.length;
	let currentFitHeight = maxHeight;
	let currentFitWidth = maxWidth;
	const textures = urls.map((url, index) =>
		loader.load(url, (texture) => {
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.generateMipmaps = true;
			texture.minFilter = THREE.LinearMipmapLinearFilter;
			texture.magFilter = THREE.LinearFilter;
			if (autoFit && index === currentFrame) fitTexture(texture, currentFitHeight, currentFitWidth);
		})
	);

	const material = new THREE.SpriteMaterial({
		map: textures[currentFrame],
		transparent: true,
		alphaTest: cutoff,
		depthWrite: false,
		toneMapped: false
	});
	const sprite = new THREE.Sprite(material);
	sprite.scale.set(width, height, 1);
	sprite.renderOrder = 4;
	sprite.userData.floorY = floorY;

	function fitTexture(texture, fitHeight = maxHeight, fitWidth = maxWidth) {
		const aspect = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 2 / 3;
		const frameHeight = Math.min(fitHeight, fitWidth / aspect);
		const frameWidth = frameHeight * aspect;
		sprite.scale.set(frameWidth, frameHeight, 1);
		sprite.position.y = floorY + frameHeight / 2;
	}

	return {
		sprite,
		setFrame(index) {
			currentFrame = ((index % textures.length) + textures.length) % textures.length;
			if (material.map !== textures[currentFrame]) {
				material.map = textures[currentFrame];
				material.needsUpdate = true;
			}
			if (autoFit) fitTexture(textures[currentFrame]);
		},
		fit(fitHeight, fitWidth) {
			if (autoFit) {
				currentFitHeight = fitHeight;
				currentFitWidth = fitWidth;
				fitTexture(textures[currentFrame], currentFitHeight, currentFitWidth);
			}
		},
		setOpacity(value) {
			material.opacity = value;
		},
		dispose() {
		for (const texture of textures) texture.dispose();
			material.dispose();
		}
	};
}
