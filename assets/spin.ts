import {
    _decorator,
    CCFloat,
    Component,
    EventTouch,
    Input,
    input,
    misc,
    NodeSpace,
    Quat,
    quat,
    v2,
    Vec3,
} from "cc";
const { ccclass, property } = _decorator;

const start = v2();
const current = v2();
const rotate = quat();
const ry = quat();

@ccclass("Spin")
export class Spin extends Component {
    @property(CCFloat)
    speed = 0.5;

    onEnable() {
        input.on(Input.EventType.TOUCH_MOVE, this._move, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_MOVE, this._move, this);
    }

    private _move(evt: EventTouch) {
        evt.getPreviousLocation(start);
        evt.getLocation(current);
        rotate.set(Quat.IDENTITY);
        const moveX = current.x - start.x;
        Quat.fromAxisAngle(
            ry,
            Vec3.UNIT_Y,
            misc.degreesToRadians(moveX * this.speed)
        );
        Quat.multiply(rotate, rotate, ry);
        this.node.rotate(rotate, NodeSpace.WORLD);
    }
}
