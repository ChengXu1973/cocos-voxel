import { _decorator, Camera, Component, RenderTexture } from "cc";
const { ccclass, property } = _decorator;

const SIZE = 16;

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

}
