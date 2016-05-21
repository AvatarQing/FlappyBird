cc.Class({
    extends: cc.Component,

    properties: {
        swooshingAudio: {
            default: null,
            url: cc.AudioClip
        },
        maskLayer: {
            default: null,
            type: cc.Node
        }
    },

    startGame(){
        cc.audioEngine.playEffect(this.swooshingAudio);
        this.maskLayer.active = true;
        this.maskLayer.opacity = 0;
        this.maskLayer.color = cc.Color.BLACK;
        this.maskLayer.runAction(
            cc.sequence(
                cc.fadeIn(0.2),
                cc.callFunc(()=> {
                    // 重新加载场景
                    cc.director.loadScene('game');
                }, this)
            )
        );
    }
});
