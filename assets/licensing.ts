import { _decorator, Component } from "cc";
const { ccclass, property } = _decorator;

@ccclass("licensing")
export class licensing extends Component {
    openLink(_, url: string) {
        window.open(url, "_blank");
    }
}
