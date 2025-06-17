import {
    _decorator,
    Camera,
    Component,
    gfx,
    instantiate,
    Mesh,
    MeshRenderer,
    Prefab,
    RenderTexture,
    Slider,
    utils,
    v3,
} from "cc";
const { ccclass, property } = _decorator;

const { Format } = gfx;
const { ATTR_POSITION, ATTR_COLOR } = gfx.AttributeName;

const MAX_INDICE_PER_MODEL = 2048;
const MIN = 12;
const MAX = 120;

@ccclass("Main")
export class Main extends Component {
    @property(Camera)
    camX: Camera;
    @property(Camera)
    camY: Camera;
    @property(Camera)
    camZ: Camera;

    @property(RenderTexture)
    textureX: RenderTexture;
    @property(RenderTexture)
    textureY: RenderTexture;
    @property(RenderTexture)
    textureZ: RenderTexture;

    @property(Mesh)
    unitMesh?: Mesh;

    @property(MeshRenderer)
    meshRender: MeshRenderer;

    @property(Prefab)
    voxel: Prefab;

    size = 32;
    voxels: Float32Array;
    pixels: Uint8Array;
    scale = v3();
    len = 0;
    frame: number;

    onLoad() {
        this.size = ~~(0.2 * (MAX - MIN)) + MIN;
        this._onSizeChange();
    }

    setSize(evt: Slider) {
        this.size = ~~(evt.progress * (MAX - MIN)) + MIN;
        this._onSizeChange();
    }

    update() {
        if (this.frame >= this.size) {
            return;
        }
        this._capturePixels();
    }

    private _onSizeChange() {
        this.node.removeAllChildren();
        this.textureX.resize(this.size, this.size);
        this.textureY.resize(this.size, this.size);
        this.textureZ.resize(this.size, this.size);
        this.len = 1 / this.size;
        this.camX.node.active = true;
        this.camY.node.active = true;
        this.camZ.node.active = true;
        this.camX.node.setPosition(0.5 + this.len / 2, 0, 0);
        this.camY.node.setPosition(0, 0.5 + this.len / 2, 0);
        this.camZ.node.setPosition(0, 0, 0.5 + this.len / 2);
        this.voxels = new Float32Array(this.size * this.size * this.size * 4);
        this.pixels = new Uint8Array(this.size * this.size * 4);
        this.frame = 0;
    }

    private _capturePixels() {
        const index = this.frame;
        this.camX.near = 1 - index * this.len; // + EPSILON;
        this.camY.near = 1 - index * this.len; // + EPSILON;
        this.camZ.near = 1 - index * this.len; // + EPSILON;
        this.camX.far = this.camX.near + this.len; // + EPSILON;
        this.camY.far = this.camY.near + this.len; // + EPSILON;
        this.camZ.far = this.camZ.near + this.len; // + EPSILON;
        this.scheduleOnce(() => {
            this._storePixels(index);
            if (index === this.size - 1) {
                this._renderVoxels();
            }
        }, 0);
        this.frame++;
    }

    private _storePixels(index: number) {
        let offset = 0;
        const L = this.size - 1;
        this.textureX.readPixels(0, 0, this.size, this.size, this.pixels);
        for (let u = 0; u < this.size; u++) {
            for (let v = 0; v < this.size; v++) {
                const x = index;
                const y = v;
                const z = L - u;
                offset = (x * this.size * this.size + y * this.size + z) * 4;
                this.voxels[offset + 0] += this.pixels[(u + v * this.size) * 4 + 0];
                this.voxels[offset + 1] += this.pixels[(u + v * this.size) * 4 + 1];
                this.voxels[offset + 2] += this.pixels[(u + v * this.size) * 4 + 2];
                this.voxels[offset + 3] += this.pixels[(u + v * this.size) * 4 + 3];
            }
        }
        this.textureY.readPixels(0, 0, this.size, this.size, this.pixels);
        for (let u = 0; u < this.size; u++) {
            for (let v = 0; v < this.size; v++) {
                const x = u;
                const y = index;
                const z = L - v;
                offset = (x * this.size * this.size + y * this.size + z) * 4;
                this.voxels[offset + 0] += this.pixels[(u + v * this.size) * 4 + 0];
                this.voxels[offset + 1] += this.pixels[(u + v * this.size) * 4 + 1];
                this.voxels[offset + 2] += this.pixels[(u + v * this.size) * 4 + 2];
                this.voxels[offset + 3] += this.pixels[(u + v * this.size) * 4 + 3];
            }
        }
        this.textureZ.readPixels(0, 0, this.size, this.size, this.pixels);
        for (let u = 0; u < this.size; u++) {
            for (let v = 0; v < this.size; v++) {
                const x = u;
                const y = v;
                const z = index;
                offset = (x * this.size * this.size + y * this.size + z) * 4;
                this.voxels[offset + 0] += this.pixels[(u + v * this.size) * 4 + 0];
                this.voxels[offset + 1] += this.pixels[(u + v * this.size) * 4 + 1];
                this.voxels[offset + 2] += this.pixels[(u + v * this.size) * 4 + 2];
                this.voxels[offset + 3] += this.pixels[(u + v * this.size) * 4 + 3];
            }
        }
    }

    private _renderVoxels() {
        this.camX.node.active = false;
        this.camY.node.active = false;
        this.camZ.node.active = false;
        // read mesh info
        const unitPositions = this.unitMesh.readAttribute(
            0,
            ATTR_POSITION
        ) as Float32Array;
        const unitIndices = this.unitMesh.readIndices(0) as Uint16Array;
        const pointCount = unitPositions.length / 3;
        const { minPosition, maxPosition } = this.unitMesh.struct;
        this.scale.set(maxPosition).subtract(minPosition);
        if (this.scale.x) this.scale.x = 1 / this.scale.x;
        if (this.scale.y) this.scale.y = 1 / this.scale.y;
        if (this.scale.z) this.scale.z = 1 / this.scale.z;
        this.scale.multiplyScalar(this.len);
        // create mesh
        const positions: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];
        let count = 0;
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const idxV = (x * this.size * this.size + y * this.size + z) * 4;
                    const r = this.voxels[idxV + 0];
                    const g = this.voxels[idxV + 1];
                    const b = this.voxels[idxV + 2];
                    const a = this.voxels[idxV + 3];
                    if (a > 0) {
                        // const v = instantiate(this.voxel);
                        // v.setScale(this.scale);
                        // v.setPosition(
                        //     x * this.len - 0.5,
                        //     y * this.len - 0.5,
                        //     z * this.len - 0.5
                        // );
                        // v.getComponent(MeshRenderer).material.setProperty(
                        //     "mainColor",
                        //     color((255 * r) / a, (255 * g) / a, (255 * b) / a, 1)
                        // );
                        // this.node.addChild(v);
                        unitIndices.forEach((i) => {
                            indices.push(pointCount * count + i);
                        });
                        for (let idxPoint = 0; idxPoint < pointCount; idxPoint++) {
                            positions.push(
                                unitPositions[idxPoint * 3 + 0] * this.scale.x +
                                x * this.len -
                                0.5
                            );
                            positions.push(
                                unitPositions[idxPoint * 3 + 1] * this.scale.y +
                                y * this.len -
                                0.5
                            );
                            positions.push(
                                unitPositions[idxPoint * 3 + 2] * this.scale.z +
                                z * this.len -
                                0.5
                            );
                            colors.push(r / a, g / a, b / a, 1);
                        }
                        count++;
                        if (indices.length >= MAX_INDICE_PER_MODEL) {
                            this._createMesh(positions, indices, colors);
                            positions.length = 0;
                            indices.length = 0;
                            colors.length = 0;
                            count = 0;
                        }
                    }
                }
            }
        }
        if (count) {
            this._createMesh(positions, indices, colors);
        }
    }

    private _createMesh(
        positions: number[],
        indices: number[],
        colors: number[]
    ) {
        const node = instantiate(this.meshRender.node);
        const mesh = utils.MeshUtils.createMesh({
            positions,
            indices,
            colors,
            attributes: [
                new gfx.Attribute(ATTR_POSITION, Format.RGB32F),
                new gfx.Attribute(ATTR_COLOR, Format.RGBA32F),
            ],
        });
        const mr = node.getComponent(MeshRenderer);
        mr.mesh = mesh;
        this.node.addChild(node);
    }
}
